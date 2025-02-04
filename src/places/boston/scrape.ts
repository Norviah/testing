import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { browserConfig } from '@/utils/config';

import puppateer, { Page } from 'puppeteer';

import { SavedPermitDataStructure } from '@/types';
import { logger } from '@/utils/logger';
import * as paths from '@/utils/paths';

// import type { SavedPermitDataStructure } from '@/types';
// import type { Page } from 'puppeteer';

// const downloadsPath = join(homedir(), 'Downloads');
// const downloadsFile = readdirSync(downloadsPath);

const LONG_DELAY = 2000;
const SHORT_DELAY = 1000;

const date = new Date();
const oldestAllowedDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);

const KEYS: (keyof SavedPermitDataStructure<string, 'MA'> | '_id' | 'ward')[] = [
  '_id',
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
  'ward',
  'property_id',
  'parcel_id',
  'gpsy',
  'gpsx',
  'y_latitude',
  'x_longitude',
];

export async function main(): Promise<void> {
  if (!existsSync(paths.BOSTON)) {
    mkdirSync(paths.BOSTON, { recursive: true });
  }

  const browser = await puppateer.launch({ ...browserConfig });
  const page = await browser.newPage();

  await page.goto(
    'https://data.boston.gov/dataset/approved-building-permits/resource/6ddcd912-32a0-43df-9908-63574f8c7e77/view/bd2ca9fb-eef6-40aa-b157-fce88f7b190c',
  );

  const issuedDate = await page.$('th[data-column-index="9"]');

  if (!issuedDate) {
    throw new Error('issuedDate not found');
  }

  await issuedDate.click();
  await wait(SHORT_DELAY);
  await issuedDate.click();
  await wait(SHORT_DELAY);

  let finished = false;

  const data: SavedPermitDataStructure<string, 'MA'>[] = [];

  // do {
  //   const { data: parsedData, finished: isFinished } = await scrape(page);
  //   finished = isFinished;
  //   data.push(...parsedData);
  // } while (!finished);

  do {
    const { data: parsedData, finished: isFinished } = await scrape(page);
    data.push(...parsedData);
    finished = isFinished;

    const nextButtonContainer = await page.$('#dtprv_next');
    const nextButton = await nextButtonContainer?.$('a');

    if (!nextButtonContainer || !nextButton) {
      throw new Error('Next button not found');
    }

    // check if next button has disabled class
    const isDisabled = await nextButtonContainer.evaluate((el) => el.classList.contains('disabled'));

    if (isDisabled) {
      finished = true;
    }

    if (!finished) {
      await nextButton.click();
      logger.info('next page');
      await wait(SHORT_DELAY);
    }
  } while (!finished);

  await page.close();
  await browser.close();

  writeFileSync(paths.BOSTON_DATA, JSON.stringify(data, null, 2));
}

async function scrape(page: Page) {
  const table = await page.$('#dtprv');
  const body = await table?.$('tbody');
  const rows = await body?.$$('tr');

  const parsedData: SavedPermitDataStructure<string, 'MA'>[] = [];

  if (!rows) {
    throw new Error('Rows not found');
  }

  for (const row of rows) {
    // const data = await row.$$('td');

    // const permitnumber = await data[1].evaluate((el) => el.textContent);
    // console.log(permitnumber);

    const data = await row.$$('td');
    const text = await Promise.all(data.map((x) => x.evaluate((el) => el.textContent)));

    if (!text || text.length === 0 || text.some((x) => typeof x !== 'string')) {
      throw new Error('Text not found');
    }

    if (KEYS.length !== text.length) {
      throw new Error('Text length does not match keys length');
    }

    const parsed: Partial<SavedPermitDataStructure<string, 'MA'>> = {};

    for (const [index, key] of KEYS.entries()) {
      if (key === '_id' || key === 'ward') {
        continue;
      }

      // @ts-ignore
      parsed[key] = key === 'city' ? parse(text[index]) : key === 'state' ? 'MA' : text[index] || undefined;
    }

    if (!parsed.issued_date) {
      throw new Error('Issued date not found');
    }

    if (parsed.city === null) {
      continue;
    }

    const issuedDate = new Date(parsed.issued_date);

    if (Number.isNaN(issuedDate.getTime())) {
      console.log('Invalid date');
      console.log(parsed);
      console.log(issuedDate);

      throw new Error('Invalid date');
    }

    if (issuedDate.getTime() < oldestAllowedDate.getTime()) {
      return { data: parsedData, finished: true };
    }

    if (
      parsed.comments?.toLowerCase().includes('demo') ||
      parsed.comments?.toLowerCase().includes('build') ||
      parsed.description?.toLowerCase().includes('demo') ||
      parsed.description?.toLowerCase().includes('build')
    ) {
      parsedData.push(parsed as SavedPermitDataStructure<string, 'MA'>);
      logger.success(`scraped ${parsed.permitnumber}`);
    }
  }

  return { data: parsedData, finished: false };
}

async function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function helper(string: string) {
  return string[0] === '(' ? `(${string.charAt(1).toUpperCase() + string.slice(2)}` : string.charAt(0).toUpperCase() + string.slice(1);
}

function capitalizeAllWords(string: string) {
  return string.split(' ').map(helper).join(' ').split('/').map(helper).join('/');
}

function parse(c: string) {
  if (!(typeof c === 'string')) {
    return null;
  }

  if (c === '/') {
    return null;
  }

  const parsed = c
    .replace(/[\/]+$/, '')
    .replace(/[^A-Za-z\/() \s']/g, '')
    .replace(/(^|\/)boston(\/|$)/gi, '')
    .trim()
    .toLowerCase();

  // const parsed = c.toLowerCase().includes('boston') ? rawParsed : 'boston, ' + rawParsed;
  const final = parsed === '' ? 'Boston' : capitalizeAllWords(parsed);

  if (final.toLowerCase() === "Boston's Historic North End".toLowerCase()) {
    return 'North End';
  }

  if (final.toLowerCase() === 'E Boston'.toLowerCase()) {
    return 'East Boston';
  }

  if (final.toLowerCase() === 'Northend'.toLowerCase()) {
    return 'North End';
  }

  return final;
}

main();
