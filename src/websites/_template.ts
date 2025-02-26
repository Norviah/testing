import { Website } from '@/structs/Website';

import type { SavedPermitDataStructure } from '@/types';
import type { Page } from 'puppeteer';

export default class Template extends Website<string, 'MA'> {
  /**
   * Whether if the manager should scrape this website.
   */
  public readonly enabled = false;

  /**
   * The base URL of the website.
   *
   * When scraping, the manager will go to this URL and call the website's
   * scrape method to get the data.
   */
  public readonly URL = '';

  /**
   * Scrapes a row from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async Scrape(page: Page): Promise<void> {
    await this.Delay();
  }

  /**
   * Cleans the scraped data.
   *
   * This takes the raw data scraped from the website and returns a cleaned
   * version.
   */
  public GetData(): SavedPermitDataStructure<string, 'MA'>[] {
    return this.data;
  }
}
