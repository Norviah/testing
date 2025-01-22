import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@/utils/db';
import * as paths from '@/utils/paths';
import { readdir } from '@/utils/readdir';

import type { Agent as AgentModel, City, MondayEntry, State } from '@prisma/client';
import { ensureKeys } from './utils/ensureKeys';
import { ensureGroup, getBoard } from './utils/group';

import { config } from '@/utils/config';
import { meta } from '@/utils/helpers';
import type { Board as BaseBoard, Group as BaseGroup } from '@mondaydotcomorg/api';
import { backOff } from 'exponential-backoff';
import type { Board, Group } from './utils/group';

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

export type Agent = {
  name: string;
  state: string;
  city: string;
  phoneNumber: string | undefined;
  email: string | undefined;
  company: string;
  officePhoneNumber: string | undefined;
  website: string | undefined;
  jobTitle: string | undefined;
  instagram: string | undefined;
  facebook: string | undefined;

  hammond: string | undefined;
  compass: string | undefined;

  teamMembers:
    | {
        name: string;
        phoneNumber: string | undefined;
        email: string | undefined;
        hammond: string | undefined;
      }[]
    | undefined;
};

async function main() {
  let ok = false;
  // const agents = JSON.parse(
  //   readFileSync(join(__filename, '..', 'backup.json'), 'utf8'),
  // ) as AgentModel[];
  const agents = await prisma.agent.findMany({ include: { monday: true } });

  const newAgents = JSON.parse(
    readFileSync(join(__filename, '..', 'combined.json'), 'utf-8'),
  ) as Agent[];

  const cities = await prisma.city.findMany({ include: { state: true } });

  for (const newAgent of newAgents) {
    console.log(newAgent.name);
    if (
      newAgent.name === 'Tracy Clark' ||
      newAgent.name === 'Amy Weed' ||
      newAgent.name === 'Claudia Andelman'
    ) {
      ok = true;
      continue;
    }

    if (!ok) {
      continue;
    }

    const existingAgent = agents.find((a) => a.name.toLowerCase() === newAgent.name.toLowerCase());
    let city = cities.find(
      (c) =>
        c.name.toLowerCase() === newAgent.city.toLowerCase() &&
        c.state.name.toLowerCase() === newAgent.state.toLowerCase(),
    );

    let BOARD_ID = city ? city.boardId! : '7041650686';
    let board: Board = await getBoard(BOARD_ID);
    let metaInfo = await ensureKeys(keys, BOARD_ID);

    if (existingAgent) {
      const record: Record<string, string> = {};
      for (const key in newAgent) {
        if (key === 'state' || key === 'city' || key === 'teamMembers') {
          continue;
        }

        const originalValue = existingAgent[key as keyof AgentModel];
        const newValue = newAgent[key as keyof Agent];

        if ((originalValue === undefined || originalValue === null) && newValue !== undefined) {
          console.log(`${key}`);
          console.log(`  ${originalValue}`);
          console.log(`  ${newValue}`);

          if (typeof newValue === 'object') {
          } else {
            record[key] = newValue;
          }
        }
      }

      const success = await prisma.agent.update({
        where: { id: existingAgent.id },
        // data: { [key]: newValue },
        data: record,
        include: { monday: true },
      });

      console.log(`updated ${success.name} in prisma`);
    } else {
      const groupName = `${newAgent.city} - ${newAgent.state}`;
      metaInfo = await ensureGroup(keys, BOARD_ID, metaInfo, groupName);
      const group = metaInfo.groups?.find((g) => g.title === groupName)!;

      console.log(city);
      console.log(newAgent);
      console.log(existingAgent);

      const newModel = await prisma.agent.create({
        data: {
          name: newAgent.name,
          company: newAgent.company,
          phoneNumber: newAgent.phoneNumber,

          cities: city
            ? { connect: { id: city.id } }
            : {
                create: {
                  name: newAgent.city,
                  state: {
                    connect: { name: newAgent.state },
                  },
                  boardId: BOARD_ID,
                  groupId: group.id,
                },
              },
          jobTitle: newAgent.jobTitle,
          officePhoneNumber: newAgent.officePhoneNumber,
          email: newAgent.email,
          website: newAgent.website,
          facebook: newAgent.facebook,
          instagram: newAgent.instagram,
          hammond: newAgent.hammond,
          compass: newAgent.compass,
        },
      });

      await pushAgent(BOARD_ID, newModel, metaInfo, group);

      console.log(`created ${newModel.name} in prisma\n`);
    }
  }

  // const dirs = [paths.COMPANIES_HAMMOND, paths.COMPANIES_COMPASS];
  // const data: Agent[] = [];

  // for (const dir of dirs) {
  //   const files = readdir(dir);

  //   for (const path of files) {
  //     const d = JSON.parse(readFileSync(path, 'utf8')) as Agent[];
  //     data.push(...d);
  //   }
  // }

  // writeFileSync(join(__filename, '..', 'combined.json'), JSON.stringify(data, null, 2));
}

async function pushAgent(
  BOARD_ID: string,
  agent: AgentModel,
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
    // console.log(agent.name);
    // console.log(metaInfo);
    // console.log(metaInfo.ids.includes(agent.name));
    // writeFileSync(join(paths.DATA, 'meta.json'), JSON.stringify(knownNames, null, 2));
    // throw new Error('stop');
    const newObject = {} as Record<string, string | undefined>;
    for (const key of keys) {
      if (key === 'name') {
        continue;
      }
      // console.log(metaInfo.columnIds);
      // console.log(key);
      // console.log(`og value: ${agent[key as keyof Agent]}`);
      // console.log(`new value: ${agent[names[key as keyof Record<string, any>] as keyof Agent]}`);
      // const newSourceObject = { ...existsInPrisma, ...agent };

      // console.log(newSourceObject);

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
      const value = agent[key as keyof AgentModel];
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
      console.log(response);
      console.log(query);
      throw new Error(response);
    }

    console.log(response);

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
    console.log(`updated agent ${success.name}`);
  } catch (e) {
    console.error(`error creating agent ${agent.name}`);
    console.error(e);
    console.log((e as Error).message);
    throw e;
  }
}

main();
