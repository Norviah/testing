import { readdirSync, writeFileSync } from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { backOff } from 'exponential-backoff';
import { launch } from 'puppeteer';

import * as paths from './paths';

import type { ElementHandle } from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 3000;

async function wait(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function main(): Promise<void> {
  const browser = await launch({ headless: false, timeout: 0 });
  const page = await browser.newPage();

  // Close any tabs that aren't the one we created on the line above
  for (const p of await browser.pages()) {
    if (p !== page) {
      await p.close();
    }
  }

  await page.goto('https://www.legacy.com/us/obituaries/local/massachusetts/abington');
  await wait(smallDelay);

  await wait(bigDelay);
  const closeModelButton = await page.$('button[data-component="ModalCloseButton"]');
  if (closeModelButton) {
    await closeModelButton.click();
    await wait(smallDelay);
  }
}

main();
