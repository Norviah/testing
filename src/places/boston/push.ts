import { readFileSync, writeFileSync } from 'node:fs';
import { CSVToStringArray } from '@/utils/CSVToStringArray';

import { config as c } from '@/utils/config';
import { isWithinAmountOfDays, meta } from '@/utils/helpers';

import { getBoard } from '@/companies/legacy/utils/group';
import * as paths from '@/utils/paths';
import * as config from './config';

const rawData = readFileSync(paths.BOSTON_RAW, 'utf-8').trim();
const rawParsedData = CSVToStringArray(rawData);
const keys = rawParsedData[0];

const today = new Date();

export async function main(): Promise<void> {
  const metaInfo = await meta(keys, config.BOARD_ID);

  const ignoredWorkTypes = [
    'plumbing permit',
    'electrical permit',
    'electrical fire alarms',
    'certificate of occupancy',
    'gas permit',
    'electrical low voltage',
    'short form bldg permit',
  ];

  // ---
  // PARSING DATA
  // ---

  const board = await getBoard(config.BOARD_ID);

  const data = rawParsedData
    .filter((row, index) => {
      if (index === 0) return true; // Include headers
      if (row[keys.indexOf('city')].toLowerCase() !== 'west roxbury') return false;

      const issuedDate = new Date(row[keys.indexOf('issued_date')]);
      if (!isWithinAmountOfDays(today, issuedDate, 30)) {
        return false;
      }

      if (board.groups.some((g) => g.names.includes(row[keys.indexOf('permitnumber')]))) {
        return false;
      }

      // const permitTypeDescription = row[keys.indexOf('permittypedescr')].toLowerCase();
      // if (ignoredWorkTypes.includes(permitTypeDescription)) {
      //   return false;
      // }

      // if (!row[keys.indexOf('comments')].toLowerCase().includes('demo')) {
      //   return false;
      // }

      const itemId = row[keys.indexOf('permitnumber')];
      return !metaInfo.ids.includes(itemId);
    })
    .sort((a, b) => {
      const aDate = new Date(a[keys.indexOf('issued_date')]);
      const bDate = new Date(b[keys.indexOf('issued_date')]);
      return bDate.getTime() - aDate.getTime();
    });

  const lines = data.map((row) => {
    return row
      .map((item) => {
        return item.replace(/,/g, ' ').replace(/"/g, "'");
      })
      .join(',')
      .replace(/[\n;]/g, ' ');
  });

  writeFileSync(paths.BOSTON_DATA, lines.join('\n'));

  // ---
  // PUSHING DATA
  // ---

  const newData = lines.map((line) => line.split(','));

  for (const row of newData.slice(1)) {
    const keyName = row[0];
    const object = keys.reduce(
      (acc, key, index) => {
        const finalName = metaInfo.columnIds[key];

        if (finalName) {
          acc[finalName] = row[index];
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const query = `mutation  {
      create_item(
        board_id: ${config.BOARD_ID}
        group_id: "1716951386_data__1"
        item_name: "${keyName}"
        column_values: "${JSON.stringify(object).replace(/"/g, '\\"')}"
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
        Authorization: c.ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: query,
      }),
    }).then((res) => res.json());

    console.log(response);
  }
}
