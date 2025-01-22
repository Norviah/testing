import { readFileSync } from 'node:fs';

import { getBoard } from '@/companies/legacy/utils/group';
import { ensureKeys } from '@/companies/svn/utils/ensureKeys';
import { CSVToStringArray } from '@/utils/CSVToStringArray';
import { config } from '@/utils/config';
import { isWithinAmountOfDays, meta } from '@/utils/helpers';
import * as paths from '@/utils/paths';

export type NewtonData = {
  recordNo: string;
  recordType: string;
  mbl: string;
  fullAddress: string;
  permitLicenseIssuedDate: string;
  projectCost: string;
  amount: string;
  proposedWorkDescription: string;
  applicantName: string;
  applicantPhoneNo: string;
};

export type NewtonDataPrisma = {
  permitnumber: string;
  permittypedescr: string;
  mbl: string;
  address: string;
  issued_date: string;
  total_fees: string;
  amount: string;
  description: string;
  applicant: string;
  applicant_mobile_number: string;
};

// export const keys = [
//   'recordNo',
//   'recordType',
//   'mbl',
//   'fullAddress',
//   'permitLicenseIssuedDate',
//   'projectCost',
//   'amount',
//   'proposedWorkDescription',
//   'applicantName',
//   'applicantPhoneNo',
// ];

const keysToPrismaKey = {
  recordNo: 'permitnumber',
  recordType: 'permittypedescr',
  mbl: 'mbl', // new
  fullAddress: 'address',
  permitLicenseIssuedDate: 'issued_date',
  projectCost: 'total_fees',
  amount: 'amount', // new
  proposedWorkDescription: 'description',
  applicantName: 'applicant', // new
  applicantPhoneNo: 'applicant_mobile_number',
};

const keys = Object.values(keysToPrismaKey);

const BOARD_ID = '6725292625';

export async function main(): Promise<void> {
  const rawDataString = readFileSync(paths.NEWTON_RAW, 'utf-8').trim();
  const rawParsedData = CSVToStringArray(rawDataString);

  const rawData = rawParsedData.map((line) => {
    return keys.reduce((obj, key, index) => {
      obj[key as keyof NewtonDataPrisma] = line[index];
      return obj;
    }, {} as NewtonDataPrisma);
  });

  const metaInfo = await ensureKeys(keys, BOARD_ID);
  const group = metaInfo.groups!.find((g) => g.title === 'Newton')!;
  const board = await getBoard(BOARD_ID);

  const today = new Date();
  const data = rawData
    .filter((data) => {
      // const isDemo = data.description.toLowerCase().includes('demo');

      // if (!isDemo) {
      //   return false;
      // }

      // if (metaInfo.ids.some((r) => r === data.permitnumber)) {
      //   return false;
      // }

      if (board.groups.some((g) => g.names.includes(data.permitnumber))) {
        return false;
      }

      const issuedDate = new Date(data.issued_date);
      if (!isWithinAmountOfDays(today, issuedDate, 30)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      return new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime();
    });

  for (const item of data) {
    try {
      const newObject = {} as Record<string, string | undefined>;
      for (const key of keys) {
        if (key === 'permitnumber') {
          continue;
        }

        const idKey = metaInfo.columnIds[key];
        const value = item[key as keyof NewtonDataPrisma];
        newObject[idKey] = value
          ? String(value).replace(/\n/g, ' ').replace(/"/g, "'").replace(/\t/g, '')
          : undefined;
        // newObject[idKey] = (agent as Record<string, string | undefined>)[key]
        //   ?.replace(/\n/g, ' ')
        //   .replace(/"/g, "'");
      }
      const query = `mutation  {
        create_item(
          board_id: ${BOARD_ID}
          group_id: "${group.id}"
          item_name: "${item.permitnumber.replace(/"/g, '\\"')}"
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
        console.log(response);
        console.log(query);
        throw new Error(response);
      }

      console.log(response);
    } catch (e) {
      console.error(`error creating item ${item.permitnumber}`);
      console.error(e);
      console.log((e as Error).message);
      throw e;
    }
  }

  // for (const item of data) {
  //   const keyName = row[0];
  //   const object = keys.reduce(
  //     (acc, key, index) => {
  //       const finalName = metaInfo.columnIds[key];

  //       if (finalName) {
  //         acc[finalName] = row[index];
  //       }
  //       return acc;
  //     },
  //     {} as Record<string, string>,
  //   );

  //   const query = `mutation  {
  //     create_item(
  //       board_id: ${BOARD_ID}
  //       group_id: "1716951386_data__1"
  //       item_name: "${keyName}"
  //       column_values: "${JSON.stringify(object).replace(/"/g, '\\"')}"
  //     ) {
  //       id
  //       column_values {
  //         id
  //         text
  //         value
  //       }
  //     }
  //   }
  //   `;

  //   const response = await fetch('https://api.monday.com/v2', {
  //     method: 'post',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: c.ACCESS_TOKEN,
  //     },
  //     body: JSON.stringify({
  //       query: query,
  //     }),
  //   }).then((res) => res.json());

  //   console.log(response);
  // }

  // const [, ...data] = readFileSync(paths.NEWTON_RAW, 'utf-8');
  // console.log(data.map((x) => CSVToStringArray(x)));
  // .split('\n')
  // .map((line) => {
  //   // const l = splitCSVLine(line);

  //   // return l.reduce((obj, value, index) => {
  //   //   const key = keys[index];
  //   //   obj[key] = value;
  //   //   return obj;
  //   // }, {} as NewtonData);

  //   // console.log(line);

  //   return CSVToStringArray(line);

  //   // return line.split(/"([^"]*?),(.*?[^"]*)"/g).reduce((obj, value, index) => {
  //   //   const key = keys[index];
  //   //   obj[key] = value;
  //   //   return obj;
  //   // }, {} as NewtonData);
  // });

  // console.log(CSVToStringArray(data));
}
