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
import { waitForDownload } from '@/utils/helpers';

import puppateer from 'puppeteer';

import type { SavedPermitDataStructure } from '@/types';
import { CSVToStringArray } from '@/utils/CSVToStringArray';
import { browserConfig } from '@/utils/config';
import * as paths from '@/utils/paths';
import { Permit } from '@prisma/client';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

const downloadLocationRoot = paths.NEWTON;
const downloadLocationRaw = paths.NEWTON_RAW;

export async function main(): Promise<void> {
  if (!existsSync(downloadLocationRoot)) {
    mkdirSync(downloadLocationRoot, { recursive: true });
  }

  const browser = await puppateer.launch(browserConfig);
  const page = await browser.newPage();

  await page.goto(
    'https://controlpanel.opengov.com/transparency-reporting/newtonma/e6a7f27e-0282-463d-9ba8-f012aaac73ae/b74e3910-13f9-4741-bb42-57e3094aeb2b?savedViewId=863a73f4-5d6a-462b-a3b0-503bf65ac358',
  );

  const detailsTable = await page.waitForSelector('#report-details-table');
  const controls = await detailsTable!.$('div');
  const [, buttons] = await controls!.$$('div');
  const exportCSVDropdownContainer = await buttons!.$('div');
  const exportCSVDropdown = await exportCSVDropdownContainer!.$('button');
  await exportCSVDropdown!.click();

  const exportButtonGroups = await page.$('#data-table-export-button');
  const buttonLists = await exportButtonGroups!.$$('li');
  const recordButton = await buttonLists![1].$('button');
  await recordButton!.click();

  // @ts-ignore
  page._client().on('Page.downloadProgress', (e) => {
    // console.log(e);
  });

  // wait for download to finish
  await waitForDownload(page);
  await browser.close();

  // get list of new files
  const file = readdirSync(downloadsPath).filter((file) => !downloadsFile.includes(file))[0];

  // console.log(`downloaded: ${file}`);
  renameSync(join(downloadsPath, file), downloadLocationRaw);
  // console.log(`moved file as: ${downloadLocationRaw}`);

  const rawDataString = readFileSync(paths.NEWTON_RAW, 'utf-8').trim();
  const rawParsedData = CSVToStringArray(rawDataString);

  type C = SavedPermitDataStructure<'Newton', 'MA'>;
  type K = keyof C;

  const keys = [
    'permitnumber',
    'permittypedescr',
    'mbl',
    'address',
    'issued_date',
    'total_fees',
    'amount',
    'description',
    'applicant',
    'applicant_mobile_number',
  ] as K[];

  const rawData = rawParsedData.map((line): SavedPermitDataStructure<'Newton', 'MA'> => {
    const ob = keys.reduce(
      (obj, key, index) => {
        // @ts-ignore
        obj[key] = line[index];
        return obj;
      },
      {} as SavedPermitDataStructure<'Newton', 'MA'>,
    );

    return {
      ...ob,
      city: 'Newton',
      state: 'MA',
    };
  });

  rawData.splice(0, 1);

  const wantedWords = ['demo', 'build'];
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const data = rawData.filter((permit) => {
    const hasWantedWords = wantedWords.some((word) => {
      if (permit.comments?.toLowerCase().includes(word)) {
        return true;
      }

      if (permit.description?.toLowerCase().includes(word)) {
        return true;
      }

      return false;
    });

    if (!hasWantedWords) {
      return false;
    }

    if (!permit.issued_date) {
      return false;
    }

    const date = new Date(permit.issued_date);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return (
      (date.getMonth() + 1 === todayMonth || date.getMonth() + 1 === todayMonth - 1) &&
      date.getFullYear() === todayYear
    );
  });

  writeFileSync(paths.NEWTON_DATA, JSON.stringify(data, null, 2));
}
