import { Website } from '@/structs/Website';

import type { SavedPermitDataStructure } from '@/types';
import { backOff } from 'exponential-backoff';
import type { ElementHandle, Page } from 'puppeteer';

export default class Framingham extends Website<'Framingham', 'MA'> {
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
  public get URL(): string {
    return `https://webapps.framinghamma.gov/permits/PermitsPage1.aspx?Type=BUILD&StartDate=${this.GetMonth()}/1/2025`;
  }

  /**
   * Determines if there are more pages to scrape.
   *
   * @param page The page that contains the data to scrape.
   * @returns Whether if there are more pages to scrape.
   */
  public async IsFinished(page: Page): Promise<{ finished: true; element: null }> {
    return { finished: true, element: null };
  }

  /**
   * Scrapes a table from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async GetTable(page: Page): Promise<ElementHandle<HTMLTableRowElement>[]> {
    const tableBody = await page.$('table');

    if (!tableBody) {
      throw new Error("couldn't find table body");
    }

    return (await tableBody.$$('tr')).slice(1);
  }

  /**
   * Determines if the scraped data is valid and should be saved.
   *
   * @param data The scraped data.
   * @returns Whether if the data is valid.
   */
  public IsDataValid(data: SavedPermitDataStructure<'Framingham', 'MA'>): boolean {
    return true;
  }

  /**
   * Scrapes a row from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async ScrapeRow(row: ElementHandle<HTMLTableRowElement>): Promise<void> {
    const [permitNumber, type, nameContainer, addressContainer, issuedDateContainer] =
      await row.$$('td');

    const permitnumber = await permitNumber.evaluate((node) => node.textContent);
    const permittypedescr = await type.evaluate((node) => node.textContent);
    const name = await nameContainer.evaluate((node) => node.textContent);
    const issuedDate = await issuedDateContainer.evaluate((node) => node.textContent);
    const address = await addressContainer.evaluate((node) => node.textContent);

    const addressLinkContainer = await addressContainer.$('a');
    const addressLink = await addressLinkContainer?.evaluate((node) => node.getAttribute('href'));

    const link = await permitNumber.$('a');
    const hrefRaw = await link?.evaluate((node) => node.getAttribute('href'));
    const href = hrefRaw ? `https://webapps.framinghamma.gov/permits/${hrefRaw}` : undefined;

    if (!permitnumber) {
      this.PrintWarn('no permit number found');
      return;
    }

    let data: SavedPermitDataStructure<'Framingham', 'MA'> = {
      permitnumber,
      permittypedescr,
      owner: name,
      address: address,
      link: href,
      city: 'Framingham',
      state: 'MA',
    };

    if (href) {
      const subData = await this.ScrapeSubPage(href);

      const ownerNameIsCompany = name?.toLowerCase() !== subData.owner?.toLowerCase();

      data = {
        ...data,
        ...subData,
        owner: ownerNameIsCompany ? subData.owner : name,
        owner_company: ownerNameIsCompany ? name : undefined,
      };
    }

    this.Save(data);
  }

  public async ScrapeSubPage(
    href: string,
  ): Promise<Partial<SavedPermitDataStructure<'Framingham', 'MA'>>> {
    const data = {} as Partial<SavedPermitDataStructure<'Framingham', 'MA'>>;

    const page = await this.browser.newPage();
    await page.goto(href);

    const rows = (await page.$$('tr')).slice(1);
    const columns = await Promise.all(rows.map((row) => row.$$('td')));

    const [permitNumber, appliedDate, status, name, total, fee, description] = await Promise.all(
      columns.map((column) => column[1].evaluate((node) => node.textContent)),
    );

    data.applied_date = appliedDate;
    data.status = status;
    data.owner = name;
    data.total_fees = total;
    data.description = description;

    await page.close();

    return data;
  }

  // public async ScrapeSubPage(permitnumber: string | undefined, href: string): Promise<void> {
  //   // try {
  //   //   const page = await this.browser.newPage();
  //   //   await page.goto(href);
  //   //   await this.Delay();
  //   //   await page.close();
  //   // } catch (e) {
  //   //   throw new Error(`Failed to create new page: ${e}`);
  //   // }

  //   try {
  //     const page = await this.browser.newPage();

  //     await backOff(async () => console.log('hi'), {
  //       numOfAttempts: this.maxAttempts,
  //       startingDelay: 5 * 1000,
  //       timeMultiple: 5,
  //       retry: async (error: Error, attemptNumber: number) => {
  //         this.PrintError(`an error occurred scraping the page for ${permitnumber}: ${error.message}\n`);

  //         await page.close();

  //         page = await browser.newPage();
  //         await page.goto(website.URL);

  //         website.PrintInfo(`retrying ${website.GetName()} #${attemptNumber}`);

  //         return true;
  //       },
  //     });
  //   } catch (error) {
  //     website.SetFailed();

  //     const [message, ...stack] = (error as Error).stack?.split('\n').map((line) => line.trim()) || [];

  //     // logger.error([`an error occurred: ${message}`, ...stack, '\n'].filter(IsString));
  //     website.PrintError([`an error occurred: ${message}`, ...stack, '\n'].filter(IsString));
  //   }
  // }

  /**
   * Scrapes the website.
   *
   * @param page A reference to the page that's loaded the website's URL.
   */
  public async Scrape(page: Page): Promise<void> {
    await this.ScrapeTable(page);
  }

  /**
   * Cleans the scraped data.
   *
   * This takes the raw data scraped from the website and returns a cleaned
   * version.
   */
  public GetData(): SavedPermitDataStructure<'Framingham', 'MA'>[] {
    return this.data;
  }
}
