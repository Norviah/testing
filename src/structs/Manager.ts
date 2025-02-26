import puppeteer from 'puppeteer';

import { Lockfile } from '@/schemas';
import { Handler } from './Handler';
import { LockfileManager } from './Lockfile';

import { logger } from '@/lib/logger';
import { IsString } from '@/lib/utils';
import { pushData } from '@/places/push';
import { browserConfig } from '@/utils/config';
import { backOff } from 'exponential-backoff';

import type { Browser } from 'puppeteer';
import type { Website } from './Website';

export class Manager {
  /**
   * The handler for modules.
   *
   * The handler is responsible for initializing and registering all website
   * modules.
   */
  public handler: Handler = new Handler();

  /**
   * The getter and setter for the lockfile.
   *
   * The program as a whole is set to run every 6 hours, however due to the
   * nature of the program, it may take longer than 6 hours to complete. The
   * lockfile is used to prevent the program from running if another instance
   * is already running.
   *
   * It reads and writes the current state from a local file.
   */
  public lockfile: LockfileManager = new LockfileManager();

  /**
   * Initializes a new `Manager` instance.
   */
  public constructor() {
    this.handler.RegisterAll();
  }

  /**
   * Marks the program's state as "InProgress" in the lockfile.
   *
   * This method prepares the lockfile by setting the state but also ensuring
   * that another instance of the program is not already running.
   */
  public PrepareLockfile(): void {
    if (this.lockfile.GetState() === Lockfile.State.InProgress) {
      throw new Error('it looks like another instance of the scraper is already running');
    }

    this.lockfile.Set(Lockfile.State.InProgress);
  }

  /**
   * Starts the scraping process.
   */
  public async Start(): Promise<void> {
    this.PrepareLockfile();

    await this.Scrape();

    this.lockfile.Set(Lockfile.State.Standby);
  }

  public async Scrape(): Promise<void> {
    const browser = await puppeteer.launch(browserConfig);
    const failedWebsites: Website<string, string>[] = [];

    for (const website of this.handler.GetModules()) {
      website.SetBrowserInstance(browser);
      await this.ScrapeWebsite(browser, website);

      if (website.Failed()) {
        failedWebsites.push(website);
        continue;
      }

      website.PrintInfo(`scraped ${website.GetName()}\n`);

      website.PrintInfo(`pushing ${website.GetName()}`);
      await pushData(website.GetData());
      website.PrintInfo(`pushed ${website.GetName()}\n\n`);
    }

    if (failedWebsites.length > 0) {
      logger.error(
        `failed to scrape ${failedWebsites.map((website) => website.GetName()).join(', ')}\n\n`,
      );
    }

    await browser.close();
  }

  /**
   * Scrapes the specified website.
   *
   * This method is responsible for calling a website's scrape method and giving
   * the method the necessary arguments to scrape whatever data it needs. It
   * also implements handling errors and retry logic.
   *
   * @param browser
   * @param website
   */
  private async ScrapeWebsite(browser: Browser, website: Website<string, string>): Promise<void> {
    let page = await browser.newPage();
    await page.goto(website.URL);

    website.PrintInfo(`scraping ${website.GetName()}`);

    try {
      await backOff(
        async () => {
          website.ResetDirectory();
          await website.Prepare(page);
          await website.Scrape(page);
        },
        {
          numOfAttempts: website.maxAttempts,
          startingDelay: 5 * 1000,
          timeMultiple: 5,
          retry: async (error: Error, attemptNumber: number) => {
            await page.close();

            page = await browser.newPage();
            await page.goto(website.URL);

            website.IncreaseAttempts();
            website.PrintError(`an error occurred: ${error.message}\n`);
            website.PrintInfo(`retrying ${website.GetName()} #${attemptNumber}`);

            return true;
          },
        },
      );
    } catch (error) {
      website.SetFailed();

      const [message, ...stack] =
        (error as Error).stack?.split('\n').map((line) => line.trim()) || [];

      website.PrintError([`an error occurred: ${message}`, ...stack, '\n'].filter(IsString));
    }

    await page.close();
  }
}
