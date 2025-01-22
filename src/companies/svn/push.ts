import { fstatSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';

import { client } from '@/utils/client';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';
import { readdir } from '@/utils/readdir';
import { getBoard } from './utils/group';

import type { Board as BaseBoard, Group as BaseGroup } from '@mondaydotcomorg/api';
import type { Agent } from './scrape';

import type { Agent as AgentModel } from '@prisma/client';
import type { Board, Group } from './utils/group';

import * as paths from '@/utils/paths';
import { createBoard } from './utils/createBoard';
import { ensureKeys } from './utils/ensureKeys';
import { ensureGroup } from './utils/group';

const keys = [
  'state',
  'city',
  'officePhoneNumber',
  'email',
  'facebook',
  'twitter',
  'linkedIn',
  'jobTitle',
  'name',
  'phoneNumber',
  'svnLink',
  'company',
];

let BOARD_ID = '7001083287';

async function main(): Promise<void> {
  let board: Board = await getBoard(BOARD_ID);
  let totalAmount = board.groups.reduce((acc, group: Group) => acc + group!.count, 0);
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

  const data = JSON.parse(readFileSync(paths.COMPANIES_SVN_DATA, 'utf-8')) as Agent[];

  for (const agent of data) {
    totalAmount += data.length;

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

    if (!agent.city || !agent.state || !agent.name) {
      console.log('skipping agent');
      console.log(agent);
      continue;
    }

    const groupName = agent.company;
    metaInfo = await ensureGroup(keys, BOARD_ID, metaInfo, groupName);
    const group = metaInfo.groups?.find((g) => g.title === groupName)!;

    // await new Promise((resolve) => setTimeout(resolve, 500));
    await pushAgent(agent, existingAgents, metaInfo, group, knownNames);
  }
}

async function pushAgent(
  agent: Agent,
  existingAgents: AgentModel[],
  metaInfo: Awaited<ReturnType<typeof meta>>,
  group: BaseGroup,
  knownNames: { names: string[]; id: string }[],
): Promise<void> {
  const existsInPrisma = existingAgents.find(
    // (a) => a.name === agent.name && a.city === agent.city && a.state === agent.state,
    (a) =>
      a.name.toLowerCase() === agent.name.toLowerCase() &&
      a.city.toLowerCase() === agent.city.toLowerCase() &&
      a.state.toLowerCase() === agent.state.toLowerCase(),
  );

  const existsInMonday = knownNames.some(
    (x) => x.id === group.id && x.names.map((x) => x.trim()).includes(agent.name.trim()),
  );

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
        // console.log(metaInfo.columnIds);
        // console.log(key);
        // console.log(`og value: ${agent[key as keyof Agent]}`);
        // console.log(`new value: ${agent[names[key as keyof Record<string, any>] as keyof Agent]}`);
        const newSourceObject = { ...existsInPrisma, ...agent };

        const idKey = metaInfo.columnIds[key];
        const value =
          key === 'realtorLink' && existsInPrisma
            ? existsInPrisma.realtorLink
            : newSourceObject[key as keyof Agent];
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

    if (!existsInMonday) {
      if (!existsInPrisma) {
        console.log(1);
        const success = await prisma.agent.create({
          data: {
            name: agent.name,
            company: agent.company,
            realtorLink: undefined,
            coldwellLink: undefined,
            phoneNumber: agent.phoneNumber,
            city: agent.city,
            state: agent.state,
            stars: undefined,
            experience: undefined,
            activityRange: undefined,
            jobTitle: agent.jobTitle,
            officePhoneNumber: agent.officePhoneNumber,
            directPhoneNumber: undefined,
            email: agent.email,
            office: undefined,
            website: undefined,
            facebook: agent.facebook,
            instagram: undefined,
            tiktok: undefined,
            twitter: agent.twitter,
            linkedIn: agent.linkedIn,
            svnLink: agent.svnLink,
          },
        });
        console.log(`created agent ${success.name}`);
      } else {
        console.log(2);
        const success = await prisma.agent.update({
          where: {
            id: existsInPrisma.id,
          },
          data: {
            state: agent.state,
            city: agent.city,
            officePhoneNumber: agent.officePhoneNumber,
            email: agent.email,
            facebook: agent.facebook,
            twitter: agent.twitter,
            linkedIn: agent.linkedIn,
            jobTitle: agent.jobTitle,
            name: agent.name,
            phoneNumber: agent.phoneNumber,
            svnLink: agent.svnLink,
            company: agent.company,
          },
        });
        console.log(existsInPrisma);
        console.log(`updated agent ${success.name}`);
      }
    }
  } catch (e) {
    console.error(`error creating agent ${agent.name}`);
    console.error(e);
    console.log((e as Error).message);
    throw e;
  }
}

main();
