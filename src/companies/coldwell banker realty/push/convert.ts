import { fstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';
import { readdir } from '@/utils/readdir';

import type { Column, Group } from '@mondaydotcomorg/api';
import type { Agent } from './Realtor';

import * as paths from '@/utils/paths';
import { importCounter, isCounterFinished, updateCounter } from './utils/counter';

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
];

// const BOARD_ID = '6944924976' as const; // FIRST BOARD
// const BOARD_ID = '6945674991' as const; // SECOND BOARD
const BOARD_ID = '6945815002' as const; // THIRD BOARD

async function main(): Promise<void> {
  let counters = importCounter();

  const states = readdirSync(paths.REALTORS)
    .sort((a, b) => {
      // make sure 'ma' is at the beginning
      if (a.includes('ma') && !b.includes('ma')) {
        return -1;
      }
      if (!a.includes('ma') && b.includes('ma')) {
        return 1;
      }
      return a.localeCompare(b);
    })
    .map((path) => join(paths.REALTORS, path))
    .filter((path) => statSync(path).isDirectory());

  const existingAgents = await prisma.agent.findMany();
  let metaInfo = await ensureKeys();

  for (const state of states) {
    // const cities = readdirSync(state)
    //   .filter((city) => !skip.includes(city))
    //   .map((path) => join(state, path))
    //   // sort aplhabetically
    //   .sort((a, b) => a.localeCompare(b));

    const cities = readdirSync(state)
      .map((path) => join(state, path))
      .sort((a, b) => a.localeCompare(b));

    for (const city of cities) {
      const sections = city.split(sep);

      const stateString = sections[sections.length - 2];
      const cityString = sections[sections.length - 1];

      if (isCounterFinished(counters, cityString, stateString)) {
        console.log(`skipping ${cityString}, ${stateString}`);
        continue;
      }

      console.log(`starting with ${city}`);
      updateCounter({
        city: cityString,
        state: stateString,
        progress: 'IN_PROGRESS',
      });

      const dataFile = join(city, 'data.json');
      const data = JSON.parse(readFileSync(dataFile, 'utf-8')) as Agent[];

      for (const agent of data) {
        const groupName = `${agent.city} - ${agent.state}`;
        metaInfo = await ensureGroup(metaInfo, groupName);
        const group = metaInfo.groups?.find((g) => g.title === groupName)!;
        // await new Promise((resolve) => setTimeout(resolve, 500));
        await pushAgent(agent, existingAgents as Agent[], metaInfo, group);
      }
      console.log(`done with ${city}\n`);

      updateCounter({
        city: cityString,
        state: stateString,
        progress: 'DONE',
      });
    }

    console.log(`done with ${state}\n`);

    return;
  }
}

async function pushAgent(
  agent: Agent,
  existingAgents: Agent[],
  metaInfo: Awaited<ReturnType<typeof meta>>,
  group: Group,
): Promise<void> {
  const exists = existingAgents.some(
    (a) => a.name === agent.name && a.city === agent.city && a.state === agent.state,
  );

  // if (exists) {
  //   return;
  // }
  try {
    const newObject = {} as Record<string, string | undefined>;
    for (const key of keys) {
      if (key === 'name') {
        continue;
      }
      const idKey = metaInfo.columnIds[key];
      const value = agent[key as keyof Agent];
      newObject[idKey] = value ? String(value).replace(/\n/g, ' ').replace(/"/g, "'") : undefined;
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
      throw new Error(response);
    }
    if (!exists) {
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
  }
}

async function ensureGroup(
  metaInfo: Awaited<ReturnType<typeof meta>>,
  name: string,
): Promise<ReturnType<typeof meta>> {
  if (!metaInfo.groups?.some((group) => group.title === name)) {
    const query = `mutation {
  create_group (board_id: ${BOARD_ID}, group_name: "${name}", position_relative_method: before_at) {
    id
  }
}`;

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
    console.log(`Created group: ${name} with id: ${response.data.create_group.id}`);
    console.log(response);
    return await meta(keys, BOARD_ID);
  }

  return metaInfo;
}

async function ensureKeys(): Promise<ReturnType<typeof meta>> {
  let metaInfo = await meta(keys, BOARD_ID);
  let changed = false;

  for (const key of keys) {
    if (key.toLowerCase() === 'name') {
      continue;
    }

    if (!metaInfo.columns?.some((col: Column) => col.title === key)) {
      changed = true;
      const query = `mutation{
    create_column(board_id: ${BOARD_ID}, title:"${key}", column_type:text) {
      id
      title
      description
    }
  }`;

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
      console.log(`Created column: ${key} with id: ${response.data.create_column.id}`);
      console.log(response);
    }
  }

  if (changed) {
    metaInfo = await meta(keys, BOARD_ID);
  }

  return metaInfo;
}

main();
