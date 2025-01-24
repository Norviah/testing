import { createWriteStream, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import puppateer from 'puppeteer';

import * as paths from '@/utils/paths';

import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { browserConfig } from '@/utils/config';
import { parse } from './parse';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

export async function main(): Promise<void> {
  if (!existsSync(paths.STOUGHTON)) {
    mkdirSync(paths.STOUGHTON, { recursive: true });
  }

  const browser = await puppateer.launch({ ...browserConfig });
  const page = await browser.newPage();

  await page.goto('https://www.stoughton.org/Archive.aspx?AMID=36');

  // const table = await page.$('.staticTableLayout');
  const [latestPermitDetails, ...rest] = await page.$$('table[summary="Archive Details"]');
  const link = await latestPermitDetails.$('a');
  const href = await link!.evaluate((node) => node.getAttribute('href'));
  const full = `https://www.stoughton.org/${href}`;

  const stream = createWriteStream(paths.STOUGHTON_PDF);
  const { body } = await fetch(full);
  // @ts-ignore
  await finished(Readable.fromWeb(body).pipe(stream));

  await page.close();
  await browser.close();

  await parse();
}
