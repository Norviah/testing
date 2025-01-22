import { writeFileSync } from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import { launch } from 'puppeteer';

import { join } from 'node:path';
import * as paths from '@/utils/paths';
import type { ElementHandle } from 'puppeteer';
import type * as puppeteer from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 1000;

async function wait(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function main(): Promise<void> {
  const browser = await launch({ headless: false });
  const page = await browser.newPage();

  // Close any tabs that aren't the one we created on the line above
  for (const p of await browser.pages()) {
    if (p !== page) {
      await p.close();
    }
  }

  await page.goto('https://www.coldwellbankerhomes.com/sitemap/massachusetts-agents/', {
    timeout: 0,
  });

  wait(smallDelay);

  const table = await page.$('.table-sort');
  const tableBody = await table!.$('tbody');
  const rows = await tableBody!.$$('tr');

  for (const row of rows) {
    const link = await row.$('a');
    const href = await link!.evaluate((el) => el.getAttribute('href'));
    console.log(`starting new ${href}`);

    const newPage = await browser.newPage();
    await newPage.goto(`https://www.coldwellbankerhomes.com${href}`);
    // await wait(smallDelay);
    const agentData = await importStateHelper(browser, newPage);

    const dir = join(paths.COMPANIES_COLDWELL, agentData[0].state.toLowerCase());
    const path = join(dir, `${agentData[0].city}.json`);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(path, JSON.stringify(agentData, null, 2));

    console.log('done\n');

    await newPage.close();
  }
}

async function importStateHelper(
  browser: puppeteer.Browser,
  page: puppeteer.Page,
): Promise<Agent[]> {
  let finished = false;
  let data: Agent[] = [];

  do {
    const call = await importStatePage(browser, page);
    finished = call.finished;
    data = data.concat(call.data);
  } while (!finished);

  return data;
}

async function importStatePage(
  browser: puppeteer.Browser,
  page: puppeteer.Page,
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
      console.log('\nno href found');
      console.log(`${nameText} from ${city}, ${state}`);
      console.log(url);

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

      console.log('');
      continue;
    }
    const newPage = await browser.newPage();
    await newPage.goto(`https://www.coldwellbankerhomes.com${href}`);
    await new Promise((r) => browser.once('targetcreated', r));
    // await wait(smallDelay);
    await newPage.bringToFront();

    const initialData = await importAgent(newPage);
    const agentData: Agent = {
      ...initialData,
      name: nameText!,
      state: state.toUpperCase(),
      city: city!.charAt(0).toUpperCase() + city!.slice(1),
    };

    console.log(`saved ${nameText} from ${city}, ${state}`);
    data.push(agentData);
    await newPage!.close();
  }

  const pagination = await page.$('.pagination');
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

type Agent = {
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
};

async function importAgent(page: puppeteer.Page): Promise<Omit<Agent, 'name' | 'state' | 'city'>> {
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
