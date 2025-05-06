import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'random-useragent';

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { backOff } from 'exponential-backoff';
import type { Agent } from '../scrape';

import { join } from 'node:path';
import * as paths from '@/utils/paths';
import type * as Puppeteer from 'puppeteer';

export type RealtorArgs = {
  state: string;
  stateAbbreviation: string;
  city: string;
};

// export type Agent = {
//   name: string;
//   company: string | undefined;
//   activityRange: string | undefined;
//   stars: number | undefined;
//   realtorLink: string | undefined;
//   experience: string | undefined;
//   phoneNumber: string | undefined;
//   state: string;
//   city: string;
// };

export type Place = {
  state: string;
  stateAbbreviation: string;
  city: string[];
};

export class Realtor {
  public state: string;
  public stateAbbreviation: string;
  public city: string;
  public dir: string;
  public key: string;

  public data: Agent[] = [];

  constructor(args: RealtorArgs) {
    this.state = args.state;
    this.stateAbbreviation = args.stateAbbreviation;
    this.city = args.city;

    this.key = `${this.city
      .toLowerCase()
      .replace(/\s/g, '-')}_${this.stateAbbreviation.toLowerCase()}`;
    this.dir = join(paths.REALTORS, this.key.split('_')[1], this.key.split('_')[0]);

    this.ensureDir();
  }

  public ensureDir(): void {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
      writeFileSync(`${this.dir}/data.json`, '[]');
    }
  }

  public async scrape(): Promise<void> {
    puppeteer.use(StealthPlugin());
    puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

    let pageNumber = 1;
    let maxPageNumber = 1;
    while (pageNumber <= maxPageNumber) {
      let r: number | undefined = undefined;

      try {
        r = await backOff(() => this.scrapePage(pageNumber), {
          numOfAttempts: 100,
          startingDelay: 1000,
          timeMultiple: 1.25,
          retry: (e, attemptNumber) => {
            if (e.message === 'no results') {
              // console.log(
                `no results for page ${pageNumber} of ${this.city}, ${this.stateAbbreviation}`,
              );
              return false;
            }

            // console.log(`retrying page ${pageNumber} attempt ${attemptNumber}`);

            return true;
          },
        });
      } catch (e) {
        if (e instanceof Error && e.message === 'no results') {
          break;
        }

        throw e;
      }

      if (r) {
        maxPageNumber = r;
      }
      // console.log(`scraped page number: ${pageNumber} of ${maxPageNumber}`);

      pageNumber++;
    }

    // console.log(`finished: ${this.city}, ${this.stateAbbreviation}\n`);
    writeFileSync(`${this.dir}/data.json`, JSON.stringify(this.data, null, 2));
  }

  public async checkNoResults(page: Puppeteer.Page): Promise<boolean> {
    const r = await page.$('.list-no-result-text');

    if (r) {
      return true;
    }

    return false;
  }

  public async scrapePage(pageNumber: number): Promise<number | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const userAgent = UserAgent.getRandom();
    await page.setUserAgent(userAgent);

    const link = `https://www.realtor.com/realestateagents/${this.key}`;

    await page.goto(pageNumber === 1 ? link : `${link}/pg-${pageNumber}`, { timeout: 0 });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const noResults = await this.checkNoResults(page);
    if (noResults) {
      await browser.close();
      throw new Error('no results');
    }

    let lastPageNumber: number | undefined = undefined;

    try {
      await this.readTable(page, pageNumber);

      const pages = await page!.$$('.pagination-item');
      const lastPage = await pages[pages.length - 1]?.evaluate((el) => el.textContent);
      lastPageNumber = Number(lastPage!);
    } catch (e) {
      await browser.close();
      throw e;
    }

    await browser.close();
    return lastPageNumber;
  }

  public async readTable(page: Puppeteer.Page, pageNumber: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const agentListCotnainer = await page.$('#agent_list_main_column');
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    const agentListWrapper = await agentListCotnainer!.$('#agent_list_wrapper');
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    const agentListCardWrapper = await agentListWrapper!.$('.cardWrapper');
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    const agentList = await agentListCardWrapper!.$('ul');
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    const agents = await agentList?.$$('.agent-list-card');

    for (const agent of agents ?? []) {
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      const cardDetails = await agent.$('.card-details');
      const [aboutSection, informationSection] = (await cardDetails?.$$(
        '.jsx-3873707352.col-lg-6.col-md-6.col-sm-12.mob-padding',
      ))!;

      const aboutSectionSpans = await aboutSection?.$$('span');
      let phoneNumber: string | undefined = undefined;
      let experienceText: string | undefined = undefined;

      for (const span of aboutSectionSpans ?? []) {
        const text = await span.evaluate((el) => el.textContent);
        const phoneNumberMatch = text?.match(/\(\d{3}\) \d{3}-\d{4}/);
        const years = text?.match(/(?<years>\d+)\s?years?\s?((?<months>\d+)\s?months)?/);

        if (years) {
          const { years: yearsMatch, months: monthsMatch } = years.groups!;
          experienceText = monthsMatch
            ? `${yearsMatch} years ${monthsMatch} months`
            : `${yearsMatch} years`;
        }

        if (phoneNumberMatch) {
          phoneNumber = phoneNumberMatch[0];
        }
      }

      let range: string | undefined = undefined;

      const informationSectionSpans = await informationSection?.$$('span');
      for (const span of informationSectionSpans ?? []) {
        const text = await span.evaluate((el) => el.textContent);

        // check if text equals this pattern: $(any number)(any letter) - $(any number)(any letter)
        const rangeMatch = text?.match(/\$([0-9]+)[a-zA-Z] - \$([0-9]+)[a-zA-Z]/);
        if (rangeMatch) {
          range = rangeMatch[0];
        }
      }

      const nameLink = await aboutSection?.$('a');
      const realtorLink = await nameLink?.getProperty('href');
      const realtorLinkValue = await realtorLink?.jsonValue();
      const nameContainer = await nameLink?.$('span');
      const name = await nameContainer?.evaluate((el) => el.textContent);

      const agentGroupContainer = await aboutSection?.$('.agent-group');
      const agentGroup = await agentGroupContainer?.$('div');
      const group = await agentGroup?.evaluate((el) => el.textContent);

      const reviewCountContainer = await aboutSection?.$('.card-review-count');
      const svgs = (await reviewCountContainer?.$$('svg')) ?? [];

      let stars: number | undefined = 0;
      for (let i = 0; i < svgs.length; i++) {
        const svg = svgs[i];
        const svgClass = await svg.evaluate((el) => el.getAttribute('data-testid'));

        if (svgClass === 'icon-star-filled') {
          stars++;
        } else if (svgClass === 'icon-star-half-color-filled') {
          stars += 0.5;
          break;
        } else {
          break;
        }
      }

      stars = svgs.length === 0 ? undefined : stars;

      const data: Agent = {
        name: name!,
        company: group || undefined,
        activityRange: range,
        stars: stars!,
        realtorLink: realtorLinkValue!,
        experience: experienceText!,
        phoneNumber,
        city: this.city,
        state: this.stateAbbreviation,
      };

      this.data.push(data);
      // // console.log(`saved: ${name}`);
    }
  }
}
