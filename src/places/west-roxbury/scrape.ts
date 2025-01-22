import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { browserConfig } from '@/utils/config';

import puppateer from 'puppeteer';

import * as paths from '@/utils/paths';

import type { SavedPermitDataStructure } from '@/types';
import type { Page } from 'puppeteer';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

const LONG_DELAY = 2000;
const SHORT_DELAY = 1000;

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
  if (!existsSync(paths.WEST_ROXBURY)) {
    mkdirSync(paths.WEST_ROXBURY, { recursive: true });
  }

  const browser = await puppateer.launch({ ...browserConfig, headless: false });
  const page = await browser.newPage();

  await page.goto(
    'https://data.boston.gov/dataset/approved-building-permits/resource/6ddcd912-32a0-43df-9908-63574f8c7e77/view/bd2ca9fb-eef6-40aa-b157-fce88f7b190c',
  );

  const westRoxbury = await getCity(page, 'West Roxbury');
  const jamaicaPlain = await getCity(page, 'Jamaica Plain');

  await page.close();
  await browser.close();

  writeFileSync(
    paths.WEST_ROXBURY_DATA,
    JSON.stringify([...westRoxbury, ...jamaicaPlain], null, 2),
  );
}

async function getCity<City extends string>(
  page: Page,
  city: City,
): Promise<SavedPermitDataStructure<'West Roxbury', 'MA'>[]> {
  await page.reload();
  await wait(LONG_DELAY);

  const searchInput = await page.$('input[type="search"]');

  if (!searchInput) {
    throw new Error('Search input not found');
  }

  await searchInput.type(city);
  await wait(LONG_DELAY);

  const issuedDate = await page.$('th[data-column-index="9"]');

  if (!issuedDate) {
    throw new Error('Issued date not found');
  }

  await issuedDate.click();
  await wait(SHORT_DELAY);
  await issuedDate.click();
  await wait(SHORT_DELAY);

  const data: SavedPermitDataStructure<'West Roxbury', 'MA'>[] = [];

  let finished = false;

  do {
    const { data: parsedData, finished: isFinished } = await parseTable(page, city);
    data.push(...parsedData);
    finished = isFinished;

    const nextButtonContainer = await page.$('#dtprv_next');
    const nextButton = await nextButtonContainer?.$('a');

    if (!nextButtonContainer || !nextButton) {
      throw new Error('Next button not found');
    }

    // check if next button has disabled class
    const isDisabled = await nextButtonContainer.evaluate((el) =>
      el.classList.contains('disabled'),
    );

    if (isDisabled) {
      finished = true;
    }

    if (!finished) {
      await nextButton.click();
      await wait(SHORT_DELAY);
    }
  } while (!finished);

  return data;
}

async function parseTable<City extends string>(
  page: Page,
  city: City,
): Promise<{ data: SavedPermitDataStructure<'West Roxbury', 'MA'>[]; finished: boolean }> {
  const table = await page.$('#dtprv');
  const body = await table?.$('tbody');
  const rows = await body?.$$('tr');

  if (!rows) {
    throw new Error('Rows not found');
  }

  // const parsedData: Record<string, any>[] = [];
  const parsedData: SavedPermitDataStructure<'West Roxbury', 'MA'>[] = [];

  const date = new Date();
  const oldestAllowedDate = new Date(date.getFullYear(), date.getMonth(), 1);

  for (const row of rows) {
    const data = await row.$$('td');
    const text = await Promise.all(data.map((x) => x.evaluate((el) => el.textContent)));

    if (!text || text.length === 0 || text.some((x) => typeof x !== 'string')) {
      throw new Error('Text not found');
    }

    if (KEYS.length !== text.length) {
      throw new Error('Text length does not match keys length');
    }

    const parsed: Partial<SavedPermitDataStructure<'West Roxbury', 'MA'>> = {};

    for (const [index, key] of KEYS.entries()) {
      if (key === '_id' || key === 'ward') {
        continue;
      }

      // @ts-ignore
      parsed[key] = key === 'city' ? city : key === 'state' ? 'MA' : text[index] || undefined;
    }

    if (!parsed.issued_date) {
      throw new Error('Issued date not found');
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
      parsed.comments?.toLowerCase().includes('build')
    ) {
      parsedData.push(parsed as SavedPermitDataStructure<'West Roxbury', 'MA'>);
    }
  }

  return { data: parsedData, finished: false };
}

async function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
