import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import puppateer from 'puppeteer';

import { CSVToStringArray } from '@/utils/CSVToStringArray';
import * as paths from '@/utils/paths';

import type { SavedPermitDataStructure } from '@/types';
import { browserConfig } from '@/utils/config';
import { waitForDownload } from '@/utils/helpers';
import { logger } from '@/utils/logger';
import { backOff } from 'exponential-backoff';
import { getPermitNumber } from './utilts';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

export async function main(): Promise<void> {
  if (!existsSync(paths.LEXINGTON)) {
    mkdirSync(paths.LEXINGTON, { recursive: true });
  }

  const browser = await puppateer.launch(browserConfig);
  const page = await browser.newPage();

  await page.goto('https://www.lexingtonma.gov/1555/Building-Permit-Activity');

  const section = await page.$('.inner.col.col8.first');
  const links = await section!.$$('a');
  const latestLink = links[links.length - 1];

  await latestLink.click();

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // get list of new files
  const file = readdirSync(downloadsPath).filter((file) => !downloadsFile.includes(file))[0];

  if (file === undefined) {
    throw new Error('No new file downloaded');
  }

  // console.log(`downloaded: ${file}`);
  renameSync(join(downloadsPath, file), paths.LEXINGTON_RAW);
  // console.log(`moved file as: ${paths.LEXINGTON_RAW}`);

  const rawRawData = readFileSync(paths.LEXINGTON_RAW, 'utf-8').trim();
  const rawParsedData = CSVToStringArray(rawRawData);
  rawParsedData.splice(0, 1);

  type Key = keyof SavedPermitDataStructure<'Lexington', 'MA'>;
  const keys: (Key | 'streetNumber' | 'streetName' | 'recordType')[] = [
    'permitnumber',
    'issued_date',
    'applicant',
    'streetNumber',
    'streetName',
    'total_fees',
    'description',
    'permittypedescr',
    'occupancytype',
    'recordType',
  ];

  const rawData = rawParsedData
    .map((row) => {
      const obj: Record<(typeof keys)[number], string | undefined> = {} as Record<
        (typeof keys)[number],
        string | undefined
      >;

      keys.forEach((key, i) => {
        obj[key] = row[i] || undefined;
      });

      const permit: SavedPermitDataStructure<'Lexington', 'MA'> = {
        city: 'Lexington',
        state: 'MA',
        permitnumber: obj.permitnumber!,
        issued_date: obj.issued_date ? String(new Date(obj.issued_date)) : null,
        address:
          obj.streetNumber && obj.streetName ? `${obj.streetNumber} ${obj.streetName}` : null,
        applicant: obj.applicant || null,
        worktype: obj.recordType || null,
        total_fees: obj.total_fees || null,
        description: obj.description!,
        permittypedescr: obj.occupancytype || null,
      };

      return permit;
    })
    .filter((permit) => permit.permitnumber.toLowerCase().charAt(0) === 'b');

  const data: Partial<SavedPermitDataStructure<'Lexington', 'MA'>>[] = [];

  for (const permit of rawData) {
    const d = await backOff(() => getPermitNumber(page, permit.permitnumber), {
      numOfAttempts: 5,
      startingDelay: 1500,
      timeMultiple: 2,
      retry: (e, attemptNumber) => {
        // console.log(`retrying ${permit.permitnumber}: attempt ${attemptNumber}`);

        return true;
      },
    });

    data.push({
      ...permit,
      ...d,
      city: 'Lexington',
      state: 'MA',
      isDemo: undefined,
      permitnumber: permit.permitnumber,
      boardId: undefined,
      groupId: undefined,
    });

    // logger.info(`downloaded: ${permit.permitnumber}`);
  }

  await page.close();
  await browser.close();

  writeFileSync(paths.LEXINGTON_DATA, JSON.stringify(data, null, 2));
  // console.log(`wrote data to: ${paths.LEXINGTON_DATA}`);
}
