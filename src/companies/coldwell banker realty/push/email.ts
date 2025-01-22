//

import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'random-useragent';

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { backOff } from 'exponential-backoff';

import { join } from 'node:path';
import * as paths from '@/utils/paths';
import type * as Puppeteer from 'puppeteer';

import { launch } from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 5000;

async function main(): Promise<void> {
  puppeteer.use(StealthPlugin());
  puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const userAgent = UserAgent.getRandom();
  await page.setUserAgent(userAgent);

  const link = 'https://www.realtor.com/realestateagents/56b0a6ec0fa4170100747f6d';
  await page.goto(link, { waitUntil: 'domcontentloaded' });

  await new Promise((resolve) => setTimeout(resolve, smallDelay));
  const capthca = await page.$('#recaptcha-anchor');
  await capthca?.click();
}

main();
