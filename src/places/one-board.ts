import { ensureGroup, getBoard } from '@/companies/legacy/utils/group';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';

import { readFileSync } from 'node:fs';
import type { SavedPermitDataStructure, SavedPermitDataStructureWithDate } from '@/types';
import { logger } from '@/utils/logger';

const BOARD_ID = '6725292625';

export async function push(file: string) {
  const raw = JSON.parse(readFileSync(file, 'utf-8')) as SavedPermitDataStructure<string, string>[];

  const data: SavedPermitDataStructureWithDate<string, string>[] = raw
    .map((permit) => {
      const { issued_date, expiration_date, applied_date, finalized_date, ...rest } = permit;

      return {
        issued_date: issued_date ? new Date(issued_date) : null,
        expiration_date: expiration_date ? new Date(expiration_date) : null,
        applied_date: applied_date ? new Date(applied_date) : null,
        finalized_date: finalized_date ? new Date(finalized_date) : null,
        ...rest,
      };
    })
    .sort((a, b) => {
      if (!a.issued_date || !b.issued_date) {
        return 0;
      }

      return b.issued_date.getTime() - a.issued_date.getTime();
    });

  const cities: Record<string, SavedPermitDataStructureWithDate<string, string>[]> = {};

  for (const permit of data) {
    if (!cities[permit.city]) {
      cities[permit.city] = [];
    }

    cities[permit.city].push(permit);
  }

  for (const city in cities) {
    await pushCity(cities[city]);
  }
}

async function pushCity(raw: SavedPermitDataStructureWithDate<string, string>[]) {
  const pushedIds: string[] = [];

  const state = await prisma.state.findUnique({
    where: {
      name: raw[0].state,
    },
  });

  const city = await prisma.city.upsert({
    where: {
      name_stateId: {
        name: raw[0].city,
        stateId: state!.id,
      },
    },
    update: {},
    create: {
      name: raw[0].city,
      stateId: state!.id,
    },
    include: {
      permits: true,
    },
  });

  if (!city) {
    throw new Error('City not found');
  }

  let board = await getBoard(BOARD_ID);
  let metaInfo = await meta([], BOARD_ID);
  let group = board.groups.find((g) => g.title.toLowerCase().includes(city.name.toLowerCase()));

  if (!group) {
    metaInfo = await ensureGroup([], BOARD_ID, metaInfo, city.name);
    board = await getBoard(BOARD_ID);
    group = board.groups.find((g) => g.title.toLowerCase().includes(city.name.toLowerCase()));
  }

  if (!group) {
    throw new Error('Group not found');
  }

  for (const permit of raw) {
    // if (city.permits.some((p) => p.permitnumber === permit.permitnumber)) {
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

  // logger.info(`pushed ${pushedIds.length} permits to ${city.name}`);
}

const keys = [
  'worktype',
  'permittypedescr',
  'description',
  'comments',
  'applicant',
  'declared_valuation',
  'total_fees',
  'issued_date',
  'expiration_date',
  'status',
  'owner',
  'occupancytype',
  'sq_feet',
  'address',
  'city',
  'state',
  'zip',
  'property_id',
  'parcel_id',
  'gpsy',
  'gpsx',
  'y_latitude',
  'x_longitude',
  'applicant_business',
  'applicant_address',
  'applicant_home_number',
  'applicant_work_number',
  'applicant_mobile_number',
  'applicant_email_address',
  'licensed_professional_name',
  'licensed_professional_business',
  'licensed_professional_address',
  'licensed_professional_not_sure',
  'estimated_cost_of_construction',
  'owner_company',
  'applied_date',
  'finalized_date',
  'owner_phone_number',
  'zone',
  'applicant_city',
  'applicant_state',
  'applicant_zip',
  'mbl',
  'amount',
  'owner_email_address',
];
