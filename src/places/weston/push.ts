import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';

import * as paths from '@/utils/paths';

import { getBoard } from '@/companies/legacy/utils/group';
import type { Column } from '@mondaydotcomorg/api';
import type { Data } from './scrape';

const BOARD_ID = '6725292625' as const;

const keys = [
  'permitnumber',
  'address',
  'city',
  'state',
  'description',
  'permittypedescr',
  'total_fees',
  'zip',
  'owner',
  'owner_phone_number',
  'owner_email_address',
  'occupancytype',
];

export async function main(): Promise<void> {
  const rawText = readFileSync(paths.WESTON_DATA, 'utf-8');
  const data = JSON.parse(rawText) as Data[];
  // console.log(data.length);

  // const existingRecords = await prisma.milton.findMany();
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

      // console.log(response);
    }
  }

  if (changed) {
    metaInfo = await meta(keys, BOARD_ID);
  }

  const group = metaInfo.groups?.find((g) => g.title.toLowerCase().includes('weston'));

  if (!group) {
    throw new Error('no group found');
  }

  const board = await getBoard(BOARD_ID);
  for (const record of data) {
    // if (metaInfo.ids.some((r) => r === record.permitnumber)) {
    //   continue;
    // }

    if (board.groups.some((g) => g.names.includes(record.permitnumber))) {
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
          .replace(/"/g, "'");
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

      if (response.error_message) {
        throw new Error(response);
      }

      // const success = await prisma.milton.create({
      //   data: {
      //     permitnumber: record.permitnumber,
      //     city: record.city,
      //     state: record.state,
      //     issued_date: record.issued_date ? new Date(record.issued_date) : undefined,
      //     owner: record.owner,
      //     owner_phone_number: record.owner_phone_number,
      //     zone: record.zone,
      //     applicant_address: record.applicant_address,
      //     applicant_city: record.applicant_city,
      //     applicant_state: record.applicant_state,
      //     applicant_zip: record.applicant_zip,
      //     applicant_mobile_number: record.applicant_mobile_number,
      //     applicant_email_address: record.applicant_email_address,
      //     applicant: record.applicant,
      //     total_fees: record.total_fees,
      //     address: record.address,
      //     status: record.status,
      //     description: record.description,
      //     property_id: record.property_id,
      //     permittypedescr: record.permittypedescr,
      //     worktype: record.worktype,
      //     expiration_date: record.expiration_date ? new Date(record.expiration_date) : undefined,
      //     sq_feet: record.sq_feet,
      //     occupancytype: record.occupancytype,
      //     zip: record.zip,
      //   },
      // });

      // console.log(`created record with permit number ${record.permitnumber}`);
    } catch (e) {
      console.error(`error creating record with permit number ${record.permitnumber}`);
      console.error(e);
    }
  }

  //

  // // console.log(existingRecords);
}
