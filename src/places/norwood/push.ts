import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';

import * as paths from '@/utils/paths';

import type { Column } from '@mondaydotcomorg/api';
import type { Record as Data } from './scrape';
import { getBoard } from '@/companies/legacy/utils/group';

const BOARD_ID = '6725292625' as const;

const keys = [
  'permitnumber',
  'worktype',
  'description',
  'city',
  'state',
  'zip',
  'address',
  'status',
  'issued_date',
  'expiration_date',
  'applicant',
  'permittypedescr',
  'total_fees',
  'owner',
  'applicant_email_address',
  'estimated_cost_of_construction',
  'owner_company',
  'applied_date',
  'finalized_date',
];

export async function main(): Promise<void> {
  const rawText = readFileSync(paths.NORWOOD_DATA, 'utf-8');
  const data = JSON.parse(rawText) as Data[];

  // const existingRecords = await prisma.norwood.findMany();
  let metaInfo = await meta(keys, BOARD_ID);
  let changed = false;

  for (const key of keys) {
    if (key.toLowerCase() === 'permitnumber') {
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

      console.log(response);
    }
  }

  if (changed) {
    metaInfo = await meta(keys, BOARD_ID);
  }

  const group = metaInfo.groups?.find((g) => g.title.toLowerCase().includes('norwood'));

  if (!group) {
    throw new Error('no group found');
  }

      const board = await getBoard(BOARD_ID);

  for (const record of data) {
    if (board.groups.some(g => g.names.includes(record.permitnumber))) {
      continue;
    }

    if (!record.permitnumber || record.permitnumber === '') {
      continue;
    }

    try {
      const newObject = {} as Record<string, string | undefined>;
      for (const key of keys) {
        if (key === 'permitnumber') {
          continue;
        }

        const idKey = metaInfo.columnIds[key];

        newObject[idKey] = (record as Record<string, string | undefined>)[key]
          ?.replace(/\n/g, ' ')
          .replace(/"/g, "'")
          .replaceAll('\t', ' ');
      }

      const query = `mutation  {
        create_item(
          board_id: ${BOARD_ID}
          group_id: "${group.id}"
          item_name: "${record.permitnumber}"
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

      console.log(response);

      if (response.error_message) {
        throw new Error(response);
      }

      // const success = await prisma.norwood.create({
      //   data: {
      //     permitnumber: record.permitnumber,
      //     worktype: record.worktype,
      //     description: record.description,
      //     city: record.city,
      //     state: record.state,
      //     zip: record.zip,
      //     address: record.address,
      //     status: record.status,
      //     issued_date: record.issued_date ? new Date(record.issued_date) : undefined,
      //     expiration_date: record.expiration_date ? new Date(record.expiration_date) : undefined,
      //     applicant: record.applicant,
      //     permittypedescr: record.permittypedescr,
      //     total_fees: record.total_fees,
      //     owner: record.owner,
      //     applicant_email_address: record.applicant_email_address,
      //     estimated_cost_of_construction: record.estimated_cost_of_construction,
      //     owner_company: record.owner_company,
      //     applied_date: record.applied_date ? new Date(record.applied_date) : undefined,
      //     finalized_date: record.finalized_date ? new Date(record.finalized_date) : undefined,
      //   },
      // });

      console.log(`created record with permit number ${record.permitnumber}`);
    } catch (e) {
      console.error(`error creating record with permit number ${record.permitnumber}`);
      console.error(e);
    }
  }

  //

  // console.log(existingRecords);
}
