import { fstatSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';

import { client } from '@/utils/client';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';
import { readdir } from '@/utils/readdir';
import { createBoard } from './utils/createBoard';
import { ensureKeys } from './utils/ensureKeys';
import { getBoard } from './utils/group';
import { ensureGroup } from './utils/group';

import type { Board as BaseBoard, Group as BaseGroup } from '@mondaydotcomorg/api';
import type { Agent, Prisma } from '@prisma/client';
import type { Agent as AgentModel } from '@prisma/client';
import type { Board, Group } from './utils/group';

import * as paths from '@/utils/paths';
import { backOff } from 'exponential-backoff';

const DIR = join(__filename, '..');

const keys = [
  // 'createdAt',
  // 'updatedAt',
  'name',
  'company',
  'phoneNumber',
  // 'cities',
  'stars',
  'experience',
  'activityRange',
  'jobTitle',
  'officePhoneNumber',
  'directPhoneNumber',
  'email',
  'office',
  'website',
  // 'contacts',
  'facebook',
  'instagram',
  'tiktok',
  'twitter',
  'linkedIn',
  'realtor',
  'coldwell',
  'svn',
  'id',
  // 'board',
  'emailed',
  'hammond',
  'compass',
];

// let BOARD_ID = '7031013132';
let BOARD_ID = '7033008619'; // 6TH BOARD

async function main(): Promise<void> {
  let board: Board = await getBoard(BOARD_ID);
  let totalAmount = board.groups.reduce((acc, group: Group) => acc + group!.count, 0);
  let metaInfo = await ensureKeys(keys, BOARD_ID);

  let boardNumber = Number(board.name.split(' ')[1]);

  const cities = (
    await prisma.city.findMany({
      include: {
        agents: {
          include: {
            monday: true,
          },
        },

        state: true,
      },

      orderBy: {
        state: {
          name: 'asc',
        },
      },
    })
  ).sort(
    //     data.sort(function (a, b) {
    //     return a.city.localeCompare(b.city) || b.price - a.price;
    // });

    (a, b) => {
      if (a.state.name < b.state.name) {
        return -1;
      }
      if (a.state.name > b.state.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    },
  );

  for (const city of cities) {
    const groupName = `${city.name} - ${city.state.name}`;
    const existingGroup = metaInfo.groups?.find((g) => g.title === groupName);

    // if (city.boardId && city.groupId && !city.agents.some((agent) => agent.monday.length === 0)) {
    if (city.boardId && city.groupId) {
      // // console.log(city.name);
      // // console.log(existingGroup?.id);

      // if (city.name === 'Lynn' && city.state.name === 'MA') {
      if (
        (city.name === 'Malden' && city.state.name === 'MA') ||
        (city.name === 'Mansfield' && city.state.name === 'MA')
      ) {
        // if (
        //   city.boardId === BOARD_ID &&
        //   !city.agents
        //     .at(-1)
        //     ?.monday.some((entry) => entry.boardId === BOARD_ID && entry.groupId === city.groupId)
        // ) {
        // // console.log(`skipping ${city.name}`);
      } else {
        continue;
      }
    }

    // // console.log(`breaking ${city.name}`);
    // throw new Error('stop');
    totalAmount += city.agents.length;

    // if (totalAmount + data.length >= 10000) {
    if (totalAmount + city.agents.length >= 9999) {
      boardNumber++;
      BOARD_ID = await createBoard(boardNumber);
      board = await getBoard(BOARD_ID);
      totalAmount = board.groups.reduce((acc, group: Group) => acc + group!.count, 0);
      totalAmount += city.agents.length;

      metaInfo = await ensureKeys(keys, BOARD_ID);
    }

    // const groupName = `${city.name} - ${city.state.name}`;
    metaInfo = await ensureGroup(keys, BOARD_ID, metaInfo, groupName);
    const group = metaInfo.groups?.find((g) => g.title === groupName)!;

    await prisma.city.update({
      where: {
        id: city.id,
      },

      data: {
        boardId: BOARD_ID,
        groupId: group.id,
      },
    });

    for (const agent of city.agents) {
      // totalAmount++;

      // // console.log(agent.name);
      if (agent.monday.some((entry) => entry.boardId === BOARD_ID && entry.groupId === group.id)) {
        continue;
      }

      // throw new Error('stop');
      // await new Promise((resolve) => setTimeout(resolve, 500));
      // await pushAgent(agent, metaInfo, group);

      try {
        await backOff(() => pushAgent(agent, metaInfo, group), {
          numOfAttempts: 10,
          startingDelay: 1000,
          timeMultiple: 1.25,
          retry: (e, attemptNumber) => {
            // console.log(
              `retrying to update ${agent.name} from ${city.name}, ${city.state.name} attempt ${attemptNumber}`,
            );

            return true;
          },
        });
      } catch (e) {
        // console.log(`failed to update ${agent.name} from ${city.name}, ${city.state.name}`);
      }
    }

    // console.log(`finished ${city.name}, ${city.state}`);
  }
}

async function pushAgent(
  agent: Agent,
  metaInfo: Awaited<ReturnType<typeof meta>>,
  group: BaseGroup,
): Promise<void> {
  // const existsInPrisma = existingAgents.find(
  //   // (a) => a.name === agent.name && a.city === agent.city && a.state === agent.state,
  //   (a) =>
  //     a.name.toLowerCase() === agent.name.toLowerCase() &&
  //     a.city.toLowerCase() === agent.city.toLowerCase() &&
  //     a.state.toLowerCase() === agent.state.toLowerCase(),
  // );

  // const existsInMonday = knownNames.some(
  //   (x) => x.id === group.id && x.names.map((x) => x.trim()).includes(agent.name.trim()),
  // );

  // if (exists) {
  //   return;
  // }
  try {
    // // console.log(agent.name);
    // // console.log(metaInfo);
    // // console.log(metaInfo.ids.includes(agent.name));
    // writeFileSync(join(paths.DATA, 'meta.json'), JSON.stringify(knownNames, null, 2));
    // throw new Error('stop');
    const newObject = {} as Record<string, string | undefined>;
    for (const key of keys) {
      if (key === 'name') {
        continue;
      }
      // // console.log(metaInfo.columnIds);
      // // console.log(key);
      // // console.log(`og value: ${agent[key as keyof Agent]}`);
      // // console.log(`new value: ${agent[names[key as keyof Record<string, any>] as keyof Agent]}`);
      // const newSourceObject = { ...existsInPrisma, ...agent };

      // // console.log(newSourceObject);

      // const idKey = metaInfo.columnIds[key];
      // const value =
      //   key === 'realtorLink' && existsInPrisma
      //     ? existsInPrisma.realtorLink
      //     : newSourceObject[names[key as keyof Record<string, any>] as keyof Agent];
      // newObject[idKey] = value
      //   ? String(value).replace(/\n/g, ' ').replace(/"/g, "'").replace(/\t/g, '')
      //   : undefined;
      // newObject[idKey] = (agent as Record<string, string | undefined>)[key]
      //   ?.replace(/\n/g, ' ')
      //   .replace(/"/g, "'");

      const idKey = metaInfo.columnIds[key];
      const value = agent[key as keyof Agent];
      newObject[idKey] =
        idKey === 'emailed'
          ? undefined
          : value
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
          item_name: "${agent.name.replace(/"/g, '\\"')}"
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
      // console.log(response);
      // console.log(query);
      throw new Error(response);
    }

    // console.log(response);

    const success = await prisma.agent.update({
      where: {
        id: agent.id,
      },

      data: {
        monday: {
          create: {
            boardId: BOARD_ID,
            groupId: group.id,
            itemId: response.data.create_item.id,
          },
        },
      },
    });
    // console.log(`updated agent ${success.name}`);
  } catch (e) {
    console.error(`error creating agent ${agent.name}`);
    console.error(e);
    // console.log((e as Error).message);
    throw e;
  }
}

main();
