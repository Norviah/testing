import { join } from 'node:path';
import { prisma } from '@/utils/db';

import { readFileSync } from 'node:fs';
import * as paths from '@/utils/paths';
import { Board, createBoard, deleteBoard, keys } from './push';

import { ensureGroup, getBoard } from '@/companies/legacy/utils/group';
import { config } from '@/utils/config';
import { meta } from '@/utils/helpers';

import { existsSync, writeFileSync } from 'node:fs';
import { ensureKeys } from '@/companies/legacy/utils/ensureKeys';
import type { SavedPermitDataStructure, SavedPermitDataStructureWithDate } from '@/types';
import { client } from '@/utils/client';
import { logger } from '@/utils/logger';

export async function main() {
  const savedCities: Board[] = JSON.parse(join(readFileSync(paths.BOARDS, 'utf-8')));
  const cities = await prisma.city.findMany({
    include: { permits: true },
    where: { permits: { some: {} } },
  });

  for (const city of cities) {
    // console.log(`pushing ${city.name}`);
    const cityIds = savedCities.find((c) => c.name === city.name)!;

    if (!cityIds) {
      throw new Error(`City ${city.name} not found in boards.json`);
    }

    const BOARD_ID = cityIds.id;

    const board = await getBoard(BOARD_ID);
    const metaInfo = await meta([], BOARD_ID);
    const pushedIds: string[] = [];

    for (const permit of city.permits) {
      const isDemo =
        permit.description?.toLowerCase().includes('demo') ||
        permit.comments?.toLowerCase().includes('demo') ||
        permit.worktype?.toLowerCase().includes('demo') ||
        permit.permittypedescr?.toLowerCase().includes('demo');

      const group = isDemo
        ? board.groups.find((g) => g.title.toLowerCase() === 'demo permits')
        : board.groups.find((g) => g.title.toLowerCase() === 'building permits');

      if (!group) {
        throw new Error(`Group not found for permit ${permit.permitnumber}`);
      }

      if (
        !permit.permitnumber ||
        group.names.includes(permit.permitnumber) ||
        pushedIds.includes(permit.permitnumber)
      ) {
        continue;
      }

      const newObject = {} as Record<string, string | Date | undefined>;
      try {
        for (const key of keys) {
          if (key === 'permitnumber') {
            continue;
          }

          const idKey = metaInfo.columnIds[key === 'status' ? 'permit_status' : key];

          const value = permit[key];
          if (value instanceof Date) {
            newObject[idKey] = value.toLocaleDateString('en-US');
          } else {
            // replace every non alphanumeric character with a space

            newObject[idKey] = value
              ? typeof value === 'string'
                ? value
                    .replace(/\n/g, ' ')
                    .replace(/"/g, "'")
                    .replace(/[^a-zA-Z0-9 ]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                : value
              : undefined;
          }
        }

        const query = `mutation  {
            create_item(
              board_id: ${BOARD_ID}
              group_id: "${group.id}"
              item_name: "${permit.permitnumber}"
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
          // console.log('\n\nERROR\n\n');
          // console.log(response);
          // console.log('\n\nERROR\n\n');
          throw new Error(response);
        }

        if (!city.permits.some((p) => p.permitnumber === permit.permitnumber)) {
          await prisma.permit.create({
            data: {
              ...permit,
              permitnumber: permit.permitnumber!,
              boardId: BOARD_ID,
              groupId: group.id,
              cityId: city.id,
              city: undefined,
              // @ts-ignore
              state: undefined,
            },
          });
        }

        // console.log(`created record with permit number ${permit.permitnumber}`);
        pushedIds.push(permit.permitnumber);
      } catch (e) {
        console.error(`error creating record with permit number ${permit.permitnumber}`);
        console.error(e);
        throw e;
      }
    }
    // console.log(`done ${city.name}\n`);
  }

  // for (const city of citiesDb) {
  //   // // console.log(`no: ${cityDb.name}`);

  //   let cityBoard = cities.find((b) => b.name === city.name);
  //   let created = false;
  //   const BOARD_ID = cityBoard ? cityBoard.id : await createBoard(`${city.name} Permits`);

  //   if (!cityBoard) {
  //     cityBoard = { name: city.name, id: BOARD_ID };
  //     created = true;

  //     // console.log(city.name);
  //   }

  //   let board = await getBoard(BOARD_ID);
  //   const keyss = await ensureKeys(keys, BOARD_ID);
  //   let metaInfo = await meta([], BOARD_ID);

  //   let demoGroup = board.groups.find((g) => {
  //     if (cityBoard.demoGroupId) {
  //       return g.id === cityBoard.demoGroupId;
  //     }

  //     return g.title.toLowerCase() === 'demo permits';
  //   });

  //   let buildingGroup = board.groups.find((g) => {
  //     if (cityBoard.buildingGroupId) {
  //       return g.id === cityBoard.buildingGroupId;
  //     }

  //     return g.title.toLowerCase() === 'building permits';
  //   });

  //   if (!demoGroup) {
  //     metaInfo = await ensureGroup([], BOARD_ID, metaInfo, 'Demo Permits');
  //     board = await getBoard(BOARD_ID);
  //     demoGroup = board.groups.find((g) => g.title.toLowerCase() === 'demo permits');
  //     cityBoard.demoGroupId = demoGroup!.id;
  //   }

  //   if (!buildingGroup) {
  //     metaInfo = await ensureGroup([], BOARD_ID, metaInfo, 'Building Permits');
  //     board = await getBoard(BOARD_ID);
  //     buildingGroup = board.groups.find((g) => g.title.toLowerCase() === 'building permits');
  //     cityBoard.buildingGroupId = buildingGroup!.id;
  //   }

  //   if (created) {
  //     const newTemplateGroup = board.groups.filter((g) => g.title.toLowerCase() === 'group title');

  //     if (newTemplateGroup.length) {
  //       for (const group of newTemplateGroup) {
  //         await deleteBoard(BOARD_ID, group.id);
  //       }
  //     }
  //   }

  //   if (created || !demoGroup || !buildingGroup) {
  //     cities.push(cityBoard);
  //     writeFileSync(paths.BOARDS, JSON.stringify(cities, null, 2));
  //   }
  //   // const city = cities.find((c) => c.name === cityDb.name);

  //   // if (!city) {
  //   //   throw new Error(`City ${cityDb.name} not found in boards.json`);
  //   // }
  // }
}

main();
