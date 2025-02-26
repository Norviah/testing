import { Website } from '@/structs/Website';

import { join } from 'node:path';
import type { SavedPermitDataStructure } from '@/types';
import type { Page } from 'puppeteer';

export default class Holliston extends Website<'Holliston', 'MA'> {
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
  public readonly URL = 'https://www.mapsonline.net/hollistonma/public_permit_reports.html.php';

  /**
   * Scrapes a row from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async Scrape(page: Page): Promise<void> {
    await this.Delay();

    const iframe = await page.waitForSelector('iframe');
    const frame = await iframe?.contentFrame();
    const body = await frame?.$('body');

    if (!body) {
      throw new Error('Body not found');
    }

    const rangeInput = await body.$('.ui.segment.control-group__pLkyg');
    const listBox = await rangeInput?.$('[role="listbox"]');

    if (!listBox) {
      throw new Error('List box not found');
    }

    await listBox.click();

    const options = await listBox.$$('div[role="option"]');
    await options[6].click();

    const submitButton = await body.$('button.ui.primary.button');

    if (!submitButton) {
      throw new Error('Submit button not found');
    }

    await submitButton.click();
    await this.Delay();

    const path = await this.Download(page, async () => {
      page.mouse.click(660, 75);
    });

    const fullPath = join(this.ROOT, path);

    this.PrintInfo(`downloaded ${fullPath}`);
  }

  /**
   * Cleans the scraped data.
   *
   * This takes the raw data scraped from the website and returns a cleaned
   * version.
   */
  public GetData(): SavedPermitDataStructure<'Holliston', 'MA'>[] {
    return this.data;
  }
}
