import { createWriteStream, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import puppateer from 'puppeteer';

import * as paths from '@/utils/paths';

import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { browserConfig } from '@/utils/config';
import { parse } from './script';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

export async function main(): Promise<void> {
  if (!existsSync(paths.NEEDHAM)) {
    mkdirSync(paths.NEEDHAM, { recursive: true });
  }

  const browser = await puppateer.launch({ ...browserConfig });
  const page = await browser.newPage();

  await page.goto('https://www.needhamma.gov/5024/Building-Permits-Issued');

  const tableContainer = await page.$('.responsiveEditor');
  const table = await tableContainer!.$('table');
  const firstRow = await table!.$('tr');

  const [, dates] = await firstRow!.$$('td');
  const links = await dates!.$$('a');
  const downloadLink = links[links.length - 1];
  const href = await downloadLink.evaluate((node) => node.getAttribute('href'));
  const full = `https://www.needhamma.gov${href}`;

  const stream = createWriteStream(paths.NEEDHAM_PDF);
  const { body } = await fetch(full);
  // @ts-ignore
  await finished(Readable.fromWeb(body).pipe(stream));

  await page.close();
  await browser.close();

  await parse();
}

main();
