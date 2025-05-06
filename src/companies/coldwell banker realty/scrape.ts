import { readdirSync, writeFileSync } from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { backOff } from 'exponential-backoff';
import { launch } from 'puppeteer';

import * as paths from '@/utils/paths';

import type { ElementHandle } from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 1000;
const BASE_URL = 'https://www.coldwellbankerhomes.com/[state]/[city]/agents/';

export type Agent = {
  state: string;
  city: string;
  name: string;
  job_title: string | undefined;
  mobile_phone: string | undefined;
  office_phone: string | undefined;
  direct_phone: string | undefined;
  email: string | undefined;
  office: string | undefined;
  website: string | undefined;
  facebook: string | undefined;
  instagram: string | undefined;
  tiktok: string | undefined;
  company: string;
  link: string | undefined;
};

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

  await scrapeCity({
    browser,
    state: 'MA',
    city: 'Weston',
    page,
  });

  // const states = readdirSync(paths.REALTORS);
  // const savedStates = readdirSync(paths.COMPANIES_COLDWELL);

  // for (const state of states) {
  //   if (!existsSync(join(paths.COMPANIES_COLDWELL, state))) {
  //     mkdirSync(join(paths.COMPANIES_COLDWELL, state), { recursive: true });
  //   }

  //   const savedCities = readdirSync(join(paths.COMPANIES_COLDWELL, state));
  //   const cities = readdirSync(join(paths.REALTORS, state)).filter(
  //     (city) => !savedCities.includes(city),
  //   );

  //   for (const city of cities) {
  //     // if (savedCities.includes(city)) {
  //     //   // console.log(`skipping ${city}, ${state}`);
  //     //   continue;
  //     // }
  //     await scrapeCity({ browser, state, city, page });
  //   }
  // }
}

async function scrapeCity({
  state,
  city,
  page,
  browser,
}: { state: string; city: string; page: Page; browser: Browser }): Promise<void> {
  await page.goto(BASE_URL.replace('[state]', state).replace('[city]', city), { timeout: 0 });
  // console.log(`starting ${city}, ${state}`);

  const pageNotFoundElement = await page.$('.page-not-found');

  let data: Agent[] = [];

  if (!pageNotFoundElement) {
    let finished = false;

    do {
      const call = await importStatePage(browser, page);
      finished = call.finished;
      data = data.concat(call.data);
    } while (!finished);
  } else {
    // console.log('unknown place, no values found\n');
  }

  const dir = join(paths.COMPANIES_COLDWELL, state, city);
  const path = join(dir, 'data.json');

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(path, JSON.stringify(data, null, 2));

  // console.log('done\n');
}
async function importStatePage(
  browser: Browser,
  page: Page,
): Promise<{ finished: boolean; data: Agent[] }> {
  const agents = await page.$$('.agent-block');
  const url = page.url();
  const [state, city] = url.trim().split('/').slice(3);
  const data: Agent[] = [];

  for (const agent of agents) {
    const name = await agent.$('.name');
    const nameLink = await name!.$('a');
    const nameText = await nameLink!.evaluate((el) => el.textContent);

    const href = await nameLink!.evaluate((el) => el.getAttribute('href'));
    if (!href) {
      // console.log('\nno href found');
      // console.log(`${nameText} from ${city}, ${state}`);
      // console.log(url);

      const agentData: Partial<Agent> = {};

      agentData.name = nameText!;

      const phoneNumbers = await agent.$('.line');
      const sections = await phoneNumbers?.$$('li');

      for (const section of sections ?? []) {
        const text = await section.evaluate((el) => el.textContent);
        const contentContainer = await section.$('span');
        const content = await contentContainer?.evaluate((el) => el.textContent);

        if (text?.toLowerCase().includes('mobile')) {
          agentData.mobile_phone = content || undefined;
        } else if (text?.toLowerCase().includes('office')) {
          agentData.office_phone = content || undefined;
        } else if (text?.toLowerCase().includes('direct')) {
          agentData.direct_phone = content || undefined;
        }
      }

      data.push(agentData as Agent);

      // console.log('');
      continue;
    }
    const newPage = await browser.newPage();
    try {
      await backOff(
        () => newPage.goto(`https://www.coldwellbankerhomes.com${href}`, { timeout: 0 }),
        {
          numOfAttempts: 5,
          startingDelay: 1000,
          timeMultiple: 1.25,
          retry: (e, attemptNumber) => {
            // console.log(`retrying to connect to page ${nameText}: attempt ${attemptNumber}`);

            return true;
          },
        },
      );
    } catch (e) {
      // console.log(`error: ${e}`);
      // console.log(`failed to connect to ${nameText}`);
      await newPage.close();
      continue;
    }

    // await new Promise((r) => browser.once('targetcreated', r));
    // await newPage.waitForNavigation();
    // await wait(300);
    // await wait(smallDelay);
    await newPage.bringToFront();

    const initialData = await importAgent(newPage);
    const agentData: Agent = {
      ...initialData,
      name: nameText!,
      state: state.toUpperCase(),
      city: city!.charAt(0).toUpperCase() + city!.slice(1),
      company: 'Coldwell Banker',
      link: href ? `https://www.coldwellbankerhomes.com${href}` : undefined,
    };

    // console.log(`scraped ${nameText}`);
    data.push(agentData);
    await newPage!.close();
  }

  const pagination = await page.$('.pagination');

  if (pagination) {
    const buttons = await pagination!.$$('li');
    const nextButton = buttons[buttons.length - 1];
    const nextButtonClass = await nextButton.evaluate((el) => el.getAttribute('class'));

    if (!nextButtonClass?.includes('disabled')) {
      await nextButton.click();
      await page.waitForNavigation();
      return { finished: false, data };
    }

    return { finished: true, data };
  }

  return { finished: true, data };
}

async function importAgent(page: Page): Promise<Omit<Agent, 'name' | 'state' | 'city'>> {
  const data: Partial<Omit<Agent, 'name' | 'state' | 'city'>> = {};

  const jobTitle = await page.$('[itemprop="jobTitle"]');
  data.job_title = (await jobTitle?.evaluate((el) => el.textContent)) || undefined;

  const infoContainer = await page.$('.list-label');
  const info = await infoContainer?.$$('li');

  for (const li of info ?? []) {
    const text = await li.evaluate((el) => el.textContent);
    const body = await li.$('.body');

    if (text?.toLowerCase().includes('email')) {
      data.email = (await body?.evaluate((el) => el.textContent)) || undefined;
    } else if (text?.toLowerCase().includes('phone')) {
      const sections = await body?.$$('li');

      for (const section of sections ?? []) {
        const text = await section.evaluate((el) => el.textContent);
        const contentContainer = await section.$('span');
        const content = await contentContainer?.evaluate((el) => el.textContent);

        if (text?.toLowerCase().includes('mobile')) {
          data.mobile_phone = content || undefined;
        } else if (text?.toLowerCase().includes('office')) {
          data.office_phone = content || undefined;
        } else if (text?.toLowerCase().includes('direct')) {
          data.direct_phone = content || undefined;
        }
      }
    } else if (text?.toLowerCase().includes('office')) {
      const officeSpan = await page?.$('.office-span');
      data.office =
        (await officeSpan?.evaluate((el) => el.textContent))?.replaceAll('\n', '') || undefined;
    }
  }

  const socials = await page.$('.list-link-icon');
  const socialsList = await socials?.$$('li');

  for (const social of socialsList ?? []) {
    const text = await social.evaluate((el) => el.textContent);
    const link = await social.$('a');
    const href = await link?.evaluate((el) => el.getAttribute('href'));

    if (text?.toLowerCase().includes('facebook')) {
      data.facebook = href || undefined;
    } else if (text?.toLowerCase().includes('instagram')) {
      data.instagram = href || undefined;
    } else if (text?.toLowerCase().includes('tiktok')) {
      data.tiktok = href || undefined;
    } else if (text?.toLowerCase().includes('website')) {
      data.website = href || undefined;
    }
  }

  return data as Omit<Agent, 'name' | 'state' | 'city'>;
}

main();
