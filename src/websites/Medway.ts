import { Website } from '@/structs/Website';

import type { SavedPermitDataStructure } from '@/types';
import type { Page } from 'puppeteer';

export default class Medway extends Website<'Medway', 'MA'> {
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
  public URL =
    'https://www6.citizenserve.com/Portal/PortalController?Action=showSearchPage&ctzPagePrefix=Portal_&installationID=278&original_iid=0&original_contactID=0';

  /**
   * Scrapes the website.
   *
   * This must be implemented by each website.
   */
  public async Scrape(page: Page): Promise<void> {}

  /**
   * Cleans the scraped data.
   *
   * This takes the raw data scraped from the website and returns a cleaned
   * version.
   */
  public GetData(): SavedPermitDataStructure<'Medway', 'MA'>[] {
    return this.data;
  }
}
