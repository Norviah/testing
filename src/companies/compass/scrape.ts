import { readdirSync, writeFileSync } from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { backOff } from 'exponential-backoff';
import { launch } from 'puppeteer';

import * as paths from '@/utils/paths';

import type { ElementHandle, Puppeteer } from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 1000;

// const STATE = 'MA' as const;
// const CITY = 'Weston' as const;
// const LINK = 'https://www.compass.com/agents/locations/weston-ma/20726/' as const;

// const STATE = 'MA' as const;
// const CITY = 'Brookline' as const;
// const LINK = 'https://www.compass.com/agents/locations/brookline-ma/20877/' as const;

// const STATE = 'MA' as const;
// const CITY = 'Wellesley' as const;
// const LINK = 'https://www.compass.com/agents/locations/wellesley-ma/20643/' as const;

// const STATE = 'MA' as const;
// const CITY = 'Needham' as const;
// const LINK = 'https://www.compass.com/agents/locations/needham-ma/20800/' as const;

// const STATE = 'MA' as const;
// const CITY = 'Newton' as const;
// const LINK = 'https://www.compass.com/agents/locations/newton-ma/20882/' as const;

const STATE = 'MA' as const;
const CITY = 'Weston' as const;
const LINK = 'https://www.compass.com/agents/locations/weston-ma/20726/' as const;

// newton, needham

export type Agent = {
  name: string;
  state: typeof STATE;
  city: typeof CITY;
  phoneNumber: string | undefined;
  email: string | undefined;
  company: 'Compass';
  compass: string | undefined;
};

const data: Agent[] = [];

async function wait(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function main(): Promise<void> {
  const browser = await launch({ headless: false, timeout: 0 });
  const page = await browser.newPage();

  const DIR = join(paths.COMPANIES_COMPASS, STATE, CITY);
  const DATA = join(DIR, 'data.json');

  if (!existsSync(DIR)) {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(DATA, '[]');
  }

  // Close any tabs that aren't the one we created on the line above
  for (const p of await browser.pages()) {
    if (p !== page) {
      await p.close();
    }
  }

  await page.goto(LINK);

  let finished = false;
  do {
    const result = await scrapePage(page);
    finished = result.finished;
    data.push(...result.data);
  } while (!finished);

  writeFileSync(DATA, JSON.stringify(data, null, 2));
  await page.close();
  // console.log('done');
}

async function scrapePage(page: Page): Promise<{ finished: boolean; data: Agent[] }> {
  const results = await page.$('.searchResults');
  const container = await results!.$('.agents-findAnAgent');
  const agents = await container!.$$('.agentCard');

  const data: Agent[] = [];

  for (const agent of agents) {
    const imageWrapper = (await agent.$(
      '.agentCard-imageWrapper',
    )) as ElementHandle<HTMLDivElement>;
    const href = await imageWrapper!.evaluate((el) => el.getAttribute('href'));

    const agentNameElement = (await agent.$('.agentCard-name')) as ElementHandle<HTMLDivElement>;
    const name = (await agentNameElement!.evaluate((el) => el.textContent))?.trim();
    // console.log(`scraping ${name}`);

    const agentEmailElement = (await agent.$('.agentCard-email')) as ElementHandle<HTMLDivElement>;
    const email = (await agentEmailElement!.evaluate((el) => el.textContent))?.trim();

    const agentPhoneElement = (await agent.$('.agentCard-phone')) as ElementHandle<HTMLDivElement>;
    const phone = (await agentPhoneElement?.evaluate((el) => el.textContent))?.trim();

    data.push({
      name: name!,
      state: STATE,
      city: CITY,
      phoneNumber: phone ? phone.split(':')[1].trim() : undefined,
      email: email || undefined,
      company: 'Compass',
      compass: `https://www.compass.com${href}`,
    });
  }

  const nextButton = (await page.$(
    '.cx-react-pagination-next',
  )) as ElementHandle<HTMLButtonElement> | null;

  const finished = (await nextButton?.evaluate((el) => el.disabled)) || false;

  if (!finished) {
    await nextButton!.click();
    await page.waitForNavigation();
  }

  return { finished, data };
}

main();
