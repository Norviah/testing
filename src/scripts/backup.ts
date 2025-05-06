import { join } from 'node:path';
import { prisma } from '@/utils/db';

import { writeFileSync } from 'node:fs';
import * as paths from '@/utils/paths';

async function main() {
  const agents = await prisma.agent.findMany({
    include: {
      cities: {
        include: {
          state: true,
        },
      },
      monday: true,
    },
  });
  writeFileSync(join(paths.DATA, 'backup', 'agents.json'), JSON.stringify(agents, null, 2));
  // console.log('Backup agents done');

  const permits = await prisma.permit.findMany({
    include: {
      city: {
        include: {
          state: true,
        },
      },
    },
  });
  writeFileSync(join(paths.DATA, 'backup', 'permits.json'), JSON.stringify(permits, null, 2));
  // console.log('Backup permits done');

  const cities = await prisma.city.findMany({
    include: {
      state: true,
      permits: true,
    },
  });
  writeFileSync(join(paths.DATA, 'backup', 'cities.json'), JSON.stringify(cities, null, 2));
  // console.log('Backup cities done');

  const states = await prisma.state.findMany();
  writeFileSync(join(paths.DATA, 'backup', 'states.json'), JSON.stringify(states, null, 2));
  // console.log('Backup states done');
}

main();
