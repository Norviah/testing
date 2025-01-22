import { readdirSync, writeFileSync } from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { backOff } from 'exponential-backoff';
import { launch } from 'puppeteer';

import * as paths from './paths';

import type { ElementHandle } from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 1000;

export type Agent = {
  state: string;
  city: string;
  officePhoneNumber: string | undefined;
  email: string | undefined;
  facebook: string | undefined;
  twitter: string | undefined;
  linkedIn: string | undefined;
  jobTitle: string | undefined;
  name: string;
  phoneNumber: string | undefined;
  svnLink: string;
  company: string;
};

const data: Agent[] = [];

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

  await page.goto('https://svnpcgboston.com/team/');

  const iframe = await page.waitForSelector('iframe');
  const frame = await iframe!.contentFrame();
  const body = await frame!.$('body');
  const divs = await body!.$$('.js-result-row');

  for (const div of divs) {
    const nameLink = await div.$('.js-broker-link');
    const name = await nameLink!.evaluate((el) => el.textContent!.trim());
    const href = await nameLink!.evaluate((el) => el.getAttribute('href'));
    const roleContainer = await div.$('.title-secondary-color');
    const role = await roleContainer!.evaluate((el) => el.textContent!.trim());

    if (!role!.toLowerCase().includes('brokerage')) {
      continue;
    }

    const newPage = await browser.newPage();
    await newPage.goto(href!);
    await newPage.bringToFront();
    const d: Agent = {
      ...(await scrapeAgent(newPage)),
      jobTitle: role,
      company: 'SVN | Parsons Commercial Group | Boston',
    };
    data.push(d);
    await newPage.close();
  }

  await browser.close();

  if (!existsSync(paths.COMPANIES_SVN)) {
    mkdirSync(paths.COMPANIES_SVN, { recursive: true });
  }

  writeFileSync(join(paths.COMPANIES_SVN, 'data.json'), JSON.stringify(data, null, 2));
  console.log('done');
}

async function scrapeAgent(page: Page): Promise<Omit<Agent, 'jobTitle' | 'company'>> {
  // return {
  //   facebook: facebookHref,
  //   twitter: twitterHref,
  //   linkedIn: linkedInHref,
  //   email,
  //   officePhoneNumber,
  // };

  const iframe = await page.waitForSelector('iframe');
  const frame = await iframe!.contentFrame();
  const body = await frame!.$('body');

  // for (const c of await body!.$$('.mb-1')) {
  //   console.log(await c.evaluate((el) => el.textContent!.trim()));
  //   console.log('-');
  // }

  const [nameContainer, stateCityContainer, officePhoneNumberContainer, phoneNumberContianer] =
    await body!.$$('.mb-1');

  const name = await nameContainer.evaluate((el) => el.textContent!.trim());
  const [city, state] = (await stateCityContainer.evaluate((el) => el.textContent!.trim())).split(
    ', ',
  );
  const officePhoneNumber = await officePhoneNumberContainer.evaluate((el) =>
    el.textContent?.trim(),
  );
  const phoneNumber = await phoneNumberContianer?.evaluate((el) => el.textContent?.trim());

  const allLinks = await body!.$$('a');

  let email: string | undefined = undefined;
  let facebook: string | undefined = undefined;
  let twitter: string | undefined = undefined;
  let linkedIn: string | undefined = undefined;

  for (const link of allLinks) {
    const href = await link.evaluate((el) => el.getAttribute('href'));
    const className = await link.evaluate((el) => el.getAttribute('class'));
    const split = href!.split(':');

    if (split[0] === 'mailto') {
      email = split[1];
    }

    if (className?.includes('facebook')) {
      facebook = href || undefined;
    } else if (className?.includes('twitter')) {
      twitter = href || undefined;
    } else if (className?.includes('linkedin')) {
      linkedIn = href || undefined;
    }
  }

  return {
    name,
    city,
    state,
    officePhoneNumber: officePhoneNumber?.split(': ')[1],
    phoneNumber: phoneNumber?.split(': ')[1],
    facebook,
    twitter,
    linkedIn,
    email,
    svnLink: page.url(),
  };
}

main();
