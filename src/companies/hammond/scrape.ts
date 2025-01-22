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

export const DIR = paths.COMPANIES_HAMMOND;
export const DATA = join(DIR, 'data.json');

// newton, needham

export type Agent = {
  name: string;
  state: 'MA';
  city: 'Chestnut Hill';
  phoneNumber: string | undefined;
  officePhoneNumber: string | undefined;
  website: string | undefined;
  jobTitle: string | undefined;
  email: string | undefined;
  company: 'Hammond';
  hammond: string | undefined;
  instagram: string | undefined;
  facebook: string | undefined;
  teamMembers:
    | {
        name: string;
        phoneNumber: string | undefined;
        email: string | undefined;
        hammond: string | undefined;
      }[]
    | undefined;
};

const data: Agent[] = [];

async function wait(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function main(): Promise<void> {
  const browser = await launch({ headless: false, timeout: 0 });
  const page = await browser.newPage();

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

  await page.goto('https://www.hammondre.com/realestate/agents/group/agents/');

  const select = await page.$('select');
  await select?.select('10996');

  await wait(smallDelay);

  const agentContainer = await page.$('#agents-list');
  const agents = await agentContainer!.$$('.agents-agent');

  for (const agent of agents) {
    const a = await agent.$('a');
    const href = await a?.evaluate((el) => el.getAttribute('href'));

    const newPage = await browser.newPage();
    await newPage.goto(`https://www.hammondre.com${href}`);
    await newPage.bringToFront();
    const d = await scrape(newPage);
    data.push(d);
    console.log(`scraped ${data[data.length - 1].name}`);
    await newPage.close();
  }

  writeFileSync(DATA, JSON.stringify(data, null, 2));
}

async function scrape(page: Page): Promise<Agent> {
  const nameContainer = await page.$('[itemprop="name"]');
  const name = (await nameContainer?.evaluate((el) => el.textContent))?.trim();

  const titleContainer = await page.$('.agent-title');
  const title = (await titleContainer?.evaluate((el) => el.textContent))?.trim();

  const cellInfo = await page.$('.agent-cell');
  const cellA = await cellInfo?.$('a');
  const phoneNumber = (await cellA?.evaluate((el) => el.textContent))?.trim();

  const officePhoneNumberInfo = await page.$('.agent-office-phone');
  const officePhoneNumberLink = await officePhoneNumberInfo?.$('a');
  const officePhoneNumber = (await officePhoneNumberLink?.evaluate((el) => el.textContent))?.trim();

  const emailContainer = await page.$('.agent-email');
  const email = (await emailContainer?.evaluate((el) => el.textContent))?.trim();

  const websiteContainer = await page.$('.agent-website');
  const website = (await websiteContainer?.evaluate((el) => el.textContent))?.trim();

  const instagramContainer = await page.$('a[title="Instagram"]');
  const instagram = (await instagramContainer?.evaluate((el) => el.getAttribute('href')))?.trim();

  const facebookContainer = await page.$('a[title="Facebook"]');
  const facebook = (await facebookContainer?.evaluate((el) => el.getAttribute('href')))?.trim();

  const data: Agent = {
    name: name!,
    state: 'MA',
    city: 'Chestnut Hill',
    company: 'Hammond',
    jobTitle: title || undefined,
    phoneNumber: phoneNumber || undefined,
    officePhoneNumber: officePhoneNumber || undefined,
    email: email || undefined,
    website: website || undefined,
    hammond: page.url(),
    instagram: instagram || undefined,
    facebook: facebook || undefined,
    teamMembers: undefined,
  };

  const biographyReadMore = await page.$('#biography-read-more-content');
  const biography = (await biographyReadMore?.evaluate((el) => el.textContent))?.trim();

  if (biography?.includes('Team Members')) {
    const ul = await biographyReadMore?.$('ul');
    const li = await ul?.$$('li');

    const members: Agent['teamMembers'] = [];

    for (const el of li || []) {
      const a = await el.$('a');
      const p = await el.$$('p');

      const name = (await a?.evaluate((el) => el.textContent))?.trim();
      const href = (await a?.evaluate((el) => el.getAttribute('href')))?.trim();
      const email = (await p[0]?.evaluate((el) => el.textContent))?.trim();
      const phoneNumber = (await p[1]?.evaluate((el) => el.textContent))?.trim();

      members.push({
        name: name!,
        email: email,
        phoneNumber: phoneNumber,
        hammond: href,
      });
    }

    data.teamMembers = members;
  }

  return data;
}

// async function scrapePage(page: Page): Promise<{ finished: boolean; data: Agent[] }> {
//   const results = await page.$('.searchResults');
//   const container = await results!.$('.agents-findAnAgent');
//   const agents = await container!.$$('.agentCard');

//   const data: Agent[] = [];

//   for (const agent of agents) {
//     const imageWrapper = (await agent.$(
//       '.agentCard-imageWrapper',
//     )) as ElementHandle<HTMLDivElement>;
//     const href = await imageWrapper!.evaluate((el) => el.getAttribute('href'));

//     const agentNameElement = (await agent.$('.agentCard-name')) as ElementHandle<HTMLDivElement>;
//     const name = (await agentNameElement!.evaluate((el) => el.textContent))?.trim();
//     console.log(`scraping ${name}`);

//     const agentEmailElement = (await agent.$('.agentCard-email')) as ElementHandle<HTMLDivElement>;
//     const email = (await agentEmailElement!.evaluate((el) => el.textContent))?.trim();

//     const agentPhoneElement = (await agent.$('.agentCard-phone')) as ElementHandle<HTMLDivElement>;
//     const phone = (await agentPhoneElement?.evaluate((el) => el.textContent))?.trim();

//     data.push({
//       name: name!,
//       state: 'MA',
//       city: 'Chestnut Hill',
//       phoneNumber: phone ? phone.split(':')[1].trim() : undefined,
//       email: email || undefined,
//       company: 'Hammond',
//       hammond: `https://www.compass.com${href}`,
//     });
//   }

//   const nextButton = (await page.$(
//     '.cx-react-pagination-next',
//   )) as ElementHandle<HTMLButtonElement> | null;

//   const finished = (await nextButton?.evaluate((el) => el.disabled)) || false;

//   if (!finished) {
//     await nextButton!.click();
//     await page.waitForNavigation();
//   }

//   return { finished, data };
// }

main();
