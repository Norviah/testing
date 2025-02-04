import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { waitForDownload } from '@/utils/helpers';

import puppateer from 'puppeteer';

import type { SavedPermitDataStructure } from '@/types';
import { CSVToStringArray } from '@/utils/CSVToStringArray';
import { browserConfig } from '@/utils/config';
import * as paths from '@/utils/paths';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

export async function main(): Promise<void> {
  // if (!existsSync(paths.WEST_ROXBURY)) {
  //   mkdirSync(paths.WEST_ROXBURY, { recursive: true });
  // }

  // const browser = await puppateer.launch(browserConfig);
  // const page = await browser.newPage();

  // await page.goto(
  //   'https://data.boston.gov/dataset/approved-building-permits/resource/6ddcd912-32a0-43df-9908-63574f8c7e77/view/bd2ca9fb-eef6-40aa-b157-fce88f7b190c',
  // );

  // // get div content container by class
  // const divContent = await page.waitForSelector('.dt-buttons.btn-group');

  // // get second child of div content
  // const exportButton = await divContent!.$('a:nth-child(2)');
  // await exportButton!.click();

  // // @ts-ignore
  // page._client().on('Page.downloadProgress', (e) => {
  //   console.log(e);
  // });

  // // find CSV button
  // const ul = await page.$('.dt-button-collection.dropdown-menu');
  // const csvButton = await ul!.$('li:nth-child(1)');
  // await csvButton!.click();

  // // wait for download to finish
  // await waitForDownload(page);
  // browser.close();

  // // get list of new files
  // const file = readdirSync(downloadsPath).filter((file) => !downloadsFile.includes(file))[0];

  // console.log(`downloaded: ${file}`);
  // renameSync(join(downloadsPath, file), paths.WEST_ROXBURY_RAW);
  // console.log(`moved file as: ${paths.WEST_ROXBURY_RAW}`);

  const rawDataString = readFileSync(paths.BOSTON_RAW, 'utf-8').trim();
  const rawParsedData = CSVToStringArray(rawDataString);

  type C = SavedPermitDataStructure<'West Roxbury', 'MA'>;
  type K = keyof C;

  const keys = [
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
  ] satisfies K[];

  const rawData = rawParsedData.map((line): SavedPermitDataStructure<'West Roxbury', 'MA'> => {
    const ob = keys.reduce(
      (obj, key, index) => {
        // @ts-ignore
        obj[key] = line[index];
        return obj;
      },
      {} as SavedPermitDataStructure<'West Roxbury', 'MA'>,
    );

    return {
      ...ob,
      city: 'West Roxbury',
      state: 'MA',
    };
  });

  rawData.splice(0, 1);

  const wantedWords = ['demo', 'build'];
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const data = rawData.filter((permit) => {
    // const hasWantedWords = wantedWords.some((word) => {
    //   if (permit.comments?.toLowerCase().includes(word)) {
    //     return true;
    //   }

    //   if (permit.description?.toLowerCase().includes(word)) {
    //     return true;
    //   }

    //   return false;
    // });

    // if (!hasWantedWords) {
    //   return false;
    // }

    if (!permit.issued_date) {
      return false;
    }

    const date = new Date(permit.issued_date);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    // return (
    //   (date.getMonth() + 1 === todayMonth || date.getMonth() + 1 === todayMonth - 1) &&
    //   date.getFullYear() === todayYear
    // );

    const month = date.getMonth() + 1;

    // return date.getFullYear() === todayYear && month >= todayMonth - 1 && month <= todayMonth;
    return date.getFullYear() === todayYear;
  });

  writeFileSync(paths.BOSTON_DATA, JSON.stringify(data, null, 2));
}
