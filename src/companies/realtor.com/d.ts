import { fstatSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';

import { client } from '@/utils/client';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';
import { readdir } from '@/utils/readdir';
import { importCounter, isCounterFinished, updateCounter } from './utils/counter';
import { getBoard } from './utils/group';

import type { Board as BaseBoard, Group as BaseGroup } from '@mondaydotcomorg/api';
import type { Agent } from './Realtor';
import type { Board, Group } from './utils/group';

import * as paths from '@/utils/paths';
import { createBoard } from './utils/createBoard';
import { ensureKeys } from './utils/ensureKeys';
import { ensureGroup } from './utils/group';

const counter = importCounter();

const keys = [
  'name',
  'company',
  'realtorLink',
  'phoneNumber',
  'city',
  'state',
  'stars',
  'experience',
  'activityRange',
];

const skip = [
  'abington',
  'acton',
  'ashland',
  'attleboro',
  'ayer',
  'belmont',
  'bridgewater',
  'brockton',
  'canton',
  'concord',
  'dedham',
  'fall-river',
  'foxborough',
  'franklin',
  'gardner',
  'halifax',
  'hanson',
  'haverhill',
  'kingston',
  'lawrence',
  'lincoln',
  'littleton',
  'lynn',
  'malden',
  'mansfield',
  'medford',
  'natick',
  'needham',
  'new-bedford',
  'newton',
  'norfolk',
  'norwood',
  'plymouth',
  'randolph',
  'revere',
  'salem',
  'sharon',
  'shirley',
  'southborough',
  'springfield',
  'stoneham',
  'sto',
];

// const BOARD_ID = '6944924976' as const; // FIRST BOARD
// const BOARD_ID = '6945674991' as const; // SECOND BOARD
// let BOARD_ID = '6945815002'; // THIRD BOARD
// let BOARD_ID = '6946385919'; // FOURTH BOARD
// let BOARD_ID = '6947208651'; // FIFTH BOARD
// let BOARD_ID = '6951213780'; // SIXTH BOARD
let BOARD_ID = '6952261550'; // SEVENTH BOARD

async function main(): Promise<void> {
  let board: Board = await getBoard(BOARD_ID);
  let totalAmount = board.groups.reduce((acc, group: Group) => acc + group!.count, 0);
  const counters = importCounter();
  let metaInfo = await ensureKeys(keys, BOARD_ID);
  const existingAgents = await prisma.agent.findMany();
  let knownNames = board.groups
    .map((x: Group) => {
      return {
        names: x.names.flat(),
        id: x.id,
      };
    })!
    .flat();

  let boardNumber = Number(board.name.split(' ')[1]);

  // const states = readdirSync(paths.REALTORS)
  //   .map((path) => join(paths.REALTORS, path))
  //   .filter((path) => statSync(path).isDirectory());

  const states = readdirSync(paths.REALTORS)
    // .sort((a, b) => {
    //   // make sure 'ma' is at the beginning
    //   if (a.includes('ma') && !b.includes('ma')) {
    //     return -1;
    //   }
    //   if (!a.includes('ma') && b.includes('ma')) {
    //     return 1;
    //   }
    //   return a.localeCompare(b);
    // })
    .map((path) => join(paths.REALTORS, path))
    .filter((path) => statSync(path).isDirectory());

  for (const state of states) {
    const cities = readdirSync(state)
      // .filter((city) => !skip.includes(city))
      .map((path) => join(state, path));

    for (const city of cities) {
      const dataFile = join(city, 'data.json');
      const data = JSON.parse(readFileSync(dataFile, 'utf-8')) as Agent[];

      const sections = city.split(sep);

      const stateString = sections[sections.length - 2];
      const cityString = sections[sections.length - 1];

      if (isCounterFinished(counters, cityString, stateString)) {
        console.log(`skipping ${cityString}, ${stateString}`);
        continue;
      }

      console.log(`starting with ${city}`);
      console.log(totalAmount);
      console.log(data.length);
      console.log(totalAmount + data.length >= 9999);

      console.log(cityString, stateString);

      totalAmount += data.length;

      // console.log(cities);

      // throw new Error('das');

      // if (totalAmount + data.length >= 10000) {
      if (totalAmount + data.length >= 9999) {
        boardNumber++;
        BOARD_ID = await createBoard(boardNumber);
        board = await getBoard(BOARD_ID);
        totalAmount = board.groups.reduce((acc, group: Group) => acc + group!.count, 0);
        totalAmount += data.length;
        knownNames = board.groups
          .map((x: Group) => {
            return {
              names: x.names.flat(),
              id: x.id,
            };
          })!
          .flat();
        metaInfo = await ensureKeys(keys, BOARD_ID);
      }

      updateCounter({
        city: cityString,
        state: stateString,
        progress: 'IN_PROGRESS',
      });

      for (const agent of data) {
        const groupName = `${agent.city} - ${agent.state}`;
        metaInfo = await ensureGroup(keys, BOARD_ID, metaInfo, groupName);
        const group = metaInfo.groups?.find((g) => g.title === groupName)!;
        // totalAmount++;

        // await new Promise((resolve) => setTimeout(resolve, 500));
        await pushAgent(agent, existingAgents as Agent[], metaInfo, group, knownNames);
      }
      console.log(`done with ${city}\n`);

      updateCounter({
        city: cityString,
        state: stateString,
        progress: 'DONE',
      });
    }

    console.log(`done with ${state}\n`);
  }
}

async function pushAgent(
  agent: Agent,
  existingAgents: Agent[],
  metaInfo: Awaited<ReturnType<typeof meta>>,
  group: BaseGroup,
  knownNames: { names: string[]; id: string }[],
): Promise<void> {
  const existsInPrisma = existingAgents.some(
    (a) => a.name === agent.name && a.city === agent.city && a.state === agent.state,
  );

  const existsInMonday = knownNames.some(
    (x) => x.id === group.id && x.names.map((x) => x.trim()).includes(agent.name.trim()),
  );

  // if (exists) {
  //   return;
  // }
  try {
    // console.log(agent.name);
    // console.log(metaInfo);
    // console.log(metaInfo.ids.includes(agent.name));
    // writeFileSync(join(paths.DATA, 'meta.json'), JSON.stringify(knownNames, null, 2));
    // throw new Error('stop');
    if (!existsInMonday) {
      const newObject = {} as Record<string, string | undefined>;
      for (const key of keys) {
        if (key === 'name') {
          continue;
        }
        const idKey = metaInfo.columnIds[key];
        const value = agent[key as keyof Agent];
        newObject[idKey] = value
          ? String(value).replace(/\n/g, ' ').replace(/"/g, "'").replace(/\t/g, '')
          : undefined;
        // newObject[idKey] = (agent as Record<string, string | undefined>)[key]
        //   ?.replace(/\n/g, ' ')
        //   .replace(/"/g, "'");
      }
      const query = `mutation  {
        create_item(
          board_id: ${BOARD_ID}
          group_id: "${group.id}"
          item_name: "${agent.name}"
          column_values: "${JSON.stringify(newObject).replace(/"/g, '\\"')}"
        ) {
          id
          column_values {
            id
            text
            value
          }
        }
      }
      `;
      const response = await fetch('https://api.monday.com/v2', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: config.ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: query,
        }),
      }).then((res) => res.json());
      if (response.error_message) {
        console.log(response);
        console.log(query);
        throw new Error(response);
      }
    }

    if (!existsInPrisma) {
      const success = await prisma.agent.create({
        data: {
          name: agent.name!,
          company: agent.company,
          realtorLink: agent.realtorLink,
          phoneNumber: agent.phoneNumber,
          city: agent.city,
          state: agent.state,
          stars: agent.stars,
          experience: agent.experience,
          activityRange: agent.activityRange,
        },
      });
      console.log(`created agent ${success.name}`);
    }
  } catch (e) {
    console.error(`error creating agent ${agent.name}`);
    console.error(e);
    console.log((e as Error).message);
    throw e;
  }
}

main();
