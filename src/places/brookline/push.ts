import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';

import * as paths from '@/utils/paths';

import { getBoard } from '@/companies/legacy/utils/group';
import type { Column } from '@mondaydotcomorg/api';
import type { Report } from './scrape';

const BOARD_ID = '6725292625' as const;
const westRoxburyKeys = [
  'permitnumber',
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
];

const keys = [
  'applicant',
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
  'description',
  'owner',
  'address',
  'city',
  'zip',
  'state',
  'worktype',
  'permittypedescr',
  'total_fees',
  'expiration_date',
  'permitnumber',
  'parcel_id',
  'occupancytype',
  'issued_date',
  'status',
];

// // print west roxbury keys that aren't in brookline keys
// const diff = westRoxburyKeys.filter((key) => !brooklineKeys.includes(key));
// // console.log(diff);

export async function main(): Promise<void> {
  const rawText = readFileSync(paths.BROOKLINE_DATA, 'utf-8');
  const data = JSON.parse(rawText) as Report[];

  // const header = brooklineKeys.join(',');
  // const lines: string[] = [header];

  // for (const record of data) {
  //   const line = brooklineKeys
  //     .map(
  //       (key) =>
  //         (record as Record<string, string>)[key]?.replaceAll(',', ' ').replaceAll('\n', ' ') ?? '',
  //     )
  //     .join(',');
  //   lines.push(line);
  // }

  // const csv = lines.join('\n');
  // writeFileSync(join(paths.BROOKLINE, 'brookline.csv'), csv, 'utf-8');

  let metaInfo = await meta(keys, BOARD_ID);
  // const existingRecords = await prisma.brookline.findMany();
  const existingRecords = metaInfo.ids;
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

  const group = metaInfo.groups?.find((g) => g.title.toLowerCase().includes('brookline'));

  if (!group) {
    throw new Error('no group found');
  }

  const board = await getBoard(BOARD_ID);

  for (const record of data) {
    // if (existingRecords.some((r) => r.permitnumber === record.permitnumber)) {
    // if (existingRecords.some((r) => r === record.permitnumber)) {
    if (!record.permitnumber) {
      continue;
    }

    if (board.groups.some((g) => g.names.includes(record.permitnumber!))) {
      continue;
    }

    try {
      const newObject = {} as Record<string, string | undefined>;
      for (const key of keys) {
        if (key === 'permitnumber') {
          continue;
        }

        const idKey = metaInfo.columnIds[key];

        // newObject[idKey] = (record as Record<string, string | undefined>)[key];
        newObject[idKey] = (record as Record<string, string | undefined | boolean>)[key]
          ?.toString()
          .replace(/\n/g, ' ')
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

      // console.log(response);

      if (response.error_message) {
        throw new Error(response);
      }

      // const success = await prisma.brookline.create({
      //   data: {
      //     applicant: record.applicant,
      //     applicant_business: record.applicant_business,
      //     applicant_address: record.applicant_address,
      //     applicant_home_number: record.applicant_home_number,
      //     applicant_work_number: record.applicant_work_number,
      //     applicant_mobile_number: record.applicant_mobile_number,
      //     applicant_email_address: record.applicant_email_address,
      //     licensed_professional_name: record.licensed_professional_name,
      //     licensed_professional_business: record.licensed_professional_business,
      //     licensed_professional_address: record.licensed_professional_address,
      //     licensed_professional_not_sure: record.licensed_professional_not_sure,
      //     description: record.description,
      //     owner: record.owner,
      //     address: record.address,
      //     city: record.city,
      //     zip: record.zip,
      //     state: record.state,
      //     worktype: record.worktype,
      //     permittypedescr: record.permittypedescr,
      //     total_fees: record.total_fees,
      //     expiration_date: record.expiration_date ? new Date(record.expiration_date) : null,
      //     permitnumber: record.permitnumber!,
      //     parcel_id: record.parcel_id,
      //     occupancytype: record.occupancytype,
      //     issued_date: record.issued_date ? new Date(record.issued_date) : null,
      //     status: record.status,
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
