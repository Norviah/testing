import { Website } from '@/structs/Website';

import type { SavedPermitDataStructure } from '@/types';
import type { ElementHandle, Page } from 'puppeteer';

export default class Somerville extends Website<'Somerville', 'MA'> {
  /**
   * Whether if the manager should scrape this website.
   */
  public readonly enabled: boolean = true;

  /**
   * The base URL of the website.
   *
   * When scraping, the manager will go to this URL and call the website's
   * scrape method to get the data.
   */
  public readonly URL =
    'https://www.citizenserve.com/Portal/PortalController?Action=showSearchPage&ctzPagePrefix=Portal_&installationID=149&original_iid=0&original_contactID=0';

  /**
   * A helper method to prepare the website for scraping.
   *
   * The initial page to load doesn't necessarily mean it's the page that
   * contains the data to scrape, so this method can be used to prepare the
   * page and go to the data.
   *
   * @param page A reference to the page that's loaded to the website's base URL.
   */
  public async Prepare(page: Page): Promise<void> {
    await page.select('#filetype', 'Permit');
    await this.Delay();

    await page.type('#to', `${this.GetMonth()}/01/${this.GetYear()}`);
    await this.Delay();

    const submitRow = await page.$('#submitRow');
    const submitButton = await submitRow?.$('button');

    if (!submitButton) {
      throw new Error("couldn't find submit button");
    }

    await submitButton.click();
    await page.waitForNavigation();
  }

  /**
   * Scrapes the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async Scrape(page: Page): Promise<void> {
    await this.ScrapePages(page);
  }

  /**
   * Determines if there are more pages to scrape.
   *
   * @param page The page that contains the data to scrape.
   * @returns Whether if there are more pages to scrape.
   */
  public async IsFinished(
    page: Page,
  ): Promise<
    { finished: true; element: null } | { finished: false; element: ElementHandle<HTMLElement> }
  > {
    const rightArrow = await page.$('i.icon-arrow-right');

    if (!rightArrow) {
      return { finished: true, element: null };
    }

    return { finished: false, element: rightArrow };
  }

  /**
   * Scrapes a row from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async ScrapeRow(row: ElementHandle<HTMLTableRowElement>): Promise<void> {
    const cells = await row.$$('td');

    if (!cells) {
      throw new Error("couldn't find cells");
    }

    const [permitNumber, address, permitType, subType, status, issueDate, description] =
      await Promise.all(cells.map((cell) => cell.evaluate((node) => node.textContent)));

    this.Save({
      permitnumber: permitNumber!,
      address: address,
      permittypedescr: permitType,
      worktype: subType,
      status: status,
      issued_date: issueDate,
      description: description,
      city: 'Somerville',
      state: 'MA',
    });
  }

  /**
   * Scrapes a table from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async GetTable(page: Page): Promise<ElementHandle<HTMLTableRowElement>[]> {
    const tableBody = await page.$('#resultContent table tbody');

    if (!tableBody) {
      throw new Error("couldn't find table body");
    }

    return await tableBody.$$('tr');
  }

  /**
   * Gets the data that was scraped.
   *
   * @returns The data that was scraped.
   */
  public GetData(): SavedPermitDataStructure<'Somerville', 'MA'>[] {
    return this.data;
  }
}
