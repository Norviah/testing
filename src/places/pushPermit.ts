import type { getBoard } from '@/companies/legacy/utils/group';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import type { meta } from '@/utils/helpers';

import type { SavedPermitDataStructureWithDate } from '@/types';
import type { City, Permit } from '@prisma/client';

export async function pushPermit({
  permit,
  group,
  metaInfo,
  keys,
  BOARD_ID,
  pushedIds,
  city,
  restGroups,
  createPrisma = true,
}: {
  BOARD_ID: string;
  group: Awaited<ReturnType<typeof getBoard>>['groups'][0];
  permit: SavedPermitDataStructureWithDate<string, string>;
  metaInfo: Awaited<ReturnType<typeof meta>>;
  keys: string[];
  // pushedIds: string[];
  pushedIds: SavedPermitDataStructureWithDate<string, string>[];
  restGroups: Awaited<ReturnType<typeof getBoard>>['groups'][0][];
  city: City & { permits: Permit[] };
  createPrisma: boolean;
}): Promise<boolean> {
  if (
    !permit.permitnumber ||
    group.names.includes(permit.permitnumber) ||
    pushedIds.some((p) => p.permitnumber === permit.permitnumber) ||
    // city.permits.some((p) => p.permitnumber === permit.permitnumber) ||
    restGroups.some((g) => g.names.some((n) => n === permit.permitnumber))
  ) {
    return false;
  }

  const newObject = {} as Record<string, string | Date | undefined>;
  try {
    for (const key of keys) {
      if (key === 'permitnumber') {
        continue;
      }

      // const idKey = metaInfo.columnIds[key === 'status' ? 'permit_status' : key];
      const idKey = key === 'status' ? 'status__1' : metaInfo.columnIds[key];

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
                .replace(/[^a-zA-Z0-9 ,@.]/g, ' ')
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
      console.log('\n\nERROR\n\n');
      console.log(response);
      console.log('\n\nERROR\n\n');
      throw new Error(response);
    }

    if (createPrisma && !city.permits.some((p) => p.permitnumber === permit.permitnumber)) {
      const isDemo =
        permit.isDemo === true ||
        permit.description?.toLowerCase().includes('demo') ||
        permit.comments?.toLowerCase().includes('demo') ||
        permit.worktype?.toLowerCase().includes('demo') ||
        permit.permittypedescr?.toLowerCase().includes('demo');

      await prisma.permit.create({
        data: {
          ...permit,
          permitnumber: permit.permitnumber!,
          boardId: BOARD_ID,
          groupId: group.id,
          cityId: city.id,
          city: undefined,
          isDemo,
          // @ts-ignore
          state: undefined,
        },
      });
    }

    // console.log(`created record with permit number ${permit.permitnumber}`);
    pushedIds.push(permit);
    return true;
  } catch (e) {
    console.error(`error creating record with permit number ${permit.permitnumber}`);
    console.error(e);
    throw e;
  }
}
