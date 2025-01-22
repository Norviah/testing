import { readdirSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { waitForDownload } from '@/utils/helpers';

import puppateer from 'puppeteer';

import * as paths from '@/utils/paths';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

const keys = [
  'permit_number',
  'address',
  'permit_type',
  'sub_type',
  'status',
  'issue_date',
  'work_description',
];

async function main(): Promise<void> {
  const browser = await puppateer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(
    'https://www6.citizenserve.com/Portal/PortalController?Action=showSearchPage&ctzPagePrefix=Portal_&installationID=390&original_iid=0&original_contactID=0#',
  );

  // select dropdowns
  await page.select('#filetype', 'Permit');
  await new Promise((resolve) => setTimeout(resolve, 300));
  await page.select('#PermitType', 'Building Permit, One or Two Family Dwelling');
  await new Promise((resolve) => setTimeout(resolve, 300));

  // click submit
  const submitRow = await page.$('#submitRow');
  const submitButton = await submitRow!.$('button');
  await submitButton!.click();

  // wait till page loads
  await page.waitForNavigation();

  const content = await page.$('#resultContent');
  const tableBody = await content!.$('tbody');
  const tableRows = await tableBody!.$$('tr');

  const s = [] as Record<string, string>[];

  for (const row of tableRows) {
    const cells = await row.$$('td');
    const data = await Promise.all(
      cells.map((cell) => cell.evaluate((node) => node.textContent!.trim().replace(/\*/g, ''))),
    );

    const obj = keys.reduce(
      (acc, key, index) => {
        acc[key] = data[index];
        return acc;
      },
      {} as Record<string, string>,
    );

    s.push(obj);
  }

  await page.close();
  await browser.close();
  writeFileSync(paths.BROCKTON_DATA, JSON.stringify(s, null, 2));
}
