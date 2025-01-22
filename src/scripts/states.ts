import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readdir } from '@/utils/readdir';

import * as paths from '@/utils/paths';

import type { Agent } from '@prisma/client';

// const directories = [paths.COMPANIES, paths.REALTORS];
// const states: { [key: string]: string[] } = {};

// for (const dir of directories) {
//   const paths = readdir(dir).filter(
//     (file) => file.endsWith('.json') && !file.endsWith('counter.json'),
//   );

//   for (const path of paths) {
//     const data = JSON.parse(readFileSync(path, 'utf-8')) as Agent[];

//     for (const agent of data) {
//       if (!agent.state || !agent.city) {
//         continue;
//       }

//       const cities = states[agent.state.toLowerCase()];

//       if (cities) {
//         if (!cities.includes(agent.city.toLowerCase())) {
//           cities.push(agent.city.toLowerCase());

//           states[agent.state.toLowerCase()] = cities;
//         }
//       } else {
//         states[agent.state.toLowerCase()] = [agent.city.toLowerCase()];
//       }
//     }

//     // if (states.has(data.state)) {
//     //   const cities = states.get(data.state);

//     //   if (cities) {
//     //     if (!cities.includes(data.city.toLowerCase())) {
//     //       cities.push(data.city.toLowerCase());
//     //       states.set(data.state, cities);
//     //     }
//     //   } else {
//     //     states.set(data.state, [data.city.toLowerCase()]);
//     //   }
//     // } else {
//     //   states.set(data.state, [data.city.toLowerCase()]);
//     // }
//   }
// }

// // const directories = [paths.COMPANIES, paths.REALTORS].flatMap((dir) => {
// //   const path = readdir(dir).filter((file) => !file.endsWith('counter.json'));

// //   return path.map((file) => {
// //     JSON.parse(readFileSync(file, 'utf-8')) as Agent;
// //   });
// // });

// // console.log(directories);
// writeFileSync(join(paths.DATA, 'states.json'), JSON.stringify(states, null, 2));

// pushing

import { prisma } from '@/utils/db';

const data = JSON.parse(readFileSync(join(paths.DATA, 'states.json'), 'utf-8')) as {
  [key: string]: string[];
};

async function main(): Promise<void> {
  for (const rawState in data) {
    const state = rawState.toUpperCase();
    const rawcities = data[rawState];
    const cities = rawcities.map((rawCity) => {
      const words = rawCity.split(/[- ]/);
      const uppercasedWords = words.map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      });

      return uppercasedWords.join(
        uppercasedWords.length > 1 ? (rawCity.includes(' ') ? ' ' : '-') : '',
      );
    });

    console.log(cities);
  }
}

main();
