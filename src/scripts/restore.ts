import { readFileSync, writeFileSync } from 'node:fs';

import { join } from 'node:path';
import { prisma } from '@/utils/db';
import * as paths from '@/utils/paths';

async function main() {
  const statesPath = join(paths.BACKUP, 'states.json');
  const states = JSON.parse(readFileSync(statesPath, 'utf-8'));

  // await prisma.state.createMany({
  //   data: states,
  // });

  const citiesPath = join(paths.BACKUP, 'cities.json');
  const cities = JSON.parse(readFileSync(citiesPath, 'utf-8')).map((city) => {
    return {
      ...city,
      state: undefined,
      stateId: city.state.id,
    };
  });

  // await prisma.city.createMany({
  //   data: cities,
  // });

  const agentsPath = join(paths.BACKUP, 'agents.json');
  const agents = JSON.parse(readFileSync(agentsPath, 'utf-8')).map((a) => {
    // return {
    //   ...a,
    //   cities: a.cities.map((c) => {
    //     return {
    //       id: c.id,
    //     };
    //   }),
    //   monday: a.monday.map((m) => {
    //     return {
    //       itemId: m.itemId,
    //       boardId: m.boardId,
    //       groupId: m.groupId,
    //     };
    //   }),
    // };

    return {
      ...a,
      monday: {
        createMany: {
          data: a.monday.map((m) => {
            return {
              itemId: m.itemId,
              boardId: m.boardId,
              groupId: m.groupId,
            };
          }),
        },
      },
      cities: {
        connect: a.cities.map((c) => ({ id: c.id })),
      },
    };
  });

  writeFileSync(join(paths.DATA, 'SOMETHING ELSE.json'), JSON.stringify(agents, null, 2));

  const agentsIds = [] as { name: string; id: string }[];

  for (const agent of agents) {
    try {
      const newAgent = await prisma.agent.create({
        data: agent,
      });

      agentsIds.push({ name: newAgent.name, id: newAgent.id });
    } catch (e) {
      // console.log(e);
      writeFileSync(join(paths.DATA, 'SOMETHING ELSE.json'), JSON.stringify(agentsIds, null, 2));
    }
  }

  // const first = agents[0];
  // // console.log(first.monday);
  // await prisma.agent.create({
  //   data: {
  //     ...first,
  //     monday: {
  //       createMany: {
  //         data: first.monday.map((m) => {
  //           return {
  //             itemId: m.itemId,
  //             boardId: m.boardId,
  //             groupId: m.groupId,
  //           };
  //         }),
  //       },
  //     },
  //     cities: {
  //       connect: first.cities.map((c) => ({ id: c.id })),
  //     },
  //   },
  // });
}

main();
