import { Website } from '@/structs/Website';

import type { SavedPermitDataStructure } from '@/types';
import type { Page } from 'puppeteer';

export default class Boston extends Website<string, 'MA'> {
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
  public readonly URL =
    'https://data.boston.gov/dataset/approved-building-permits/resource/6ddcd912-32a0-43df-9908-63574f8c7e77/view/bd2ca9fb-eef6-40aa-b157-fce88f7b190c';

  /**
   * Scrapes the website.
   *
   * @param page A reference to the page that's loaded the website's URL.
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
