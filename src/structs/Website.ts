import { join } from 'node:path';
import { logger } from '@/lib/logger';
import { DATE } from '@/lib/utils';

import type { SavedPermitDataStructure } from '@/types';
import type { LoggingOptions } from '@norviah/logger';
import type { Browser, ElementHandle, Page } from 'puppeteer';

import { existsSync, mkdirSync, readdirSync, rm, rmSync, rmdirSync } from 'node:fs';
import * as paths from '@/utils/paths';

export abstract class Website<City extends string, State extends string> {
  /**
   * The puppeteer browser instance.
   */
  public browser!: Browser;

  /**
   * The base URL of the website.
   *
   * When scraping, the manager will go to this URL and call the website's
   * scrape method to get the data.
   */
  public abstract readonly URL: string;

  /**
   * The root directory to save any files into.
   */
  protected readonly ROOT: string = join(paths.PERMITS, this.GetName());

  /**
   * Whether if the manager should scrape this website.
   */
  public readonly enabled: boolean = true;

  /**
   * All data scraped from the website.
   *
   * This doesn't represent the final cleaned data, but rather the raw data
   * scraped from the website.
   */
  public readonly data: SavedPermitDataStructure<City, State>[] = [];

  /**
   * The default amount of time to use when delaying the script.
   */
  public readonly delayAmount = 5 * 1000;

  /**
   * The maximum amount of attempts to scrape the website before giving up.
   */
  public readonly maxAttempts = 3;

  /**
   * References the current attempt number for scraping.
   */
  private attemptNumber = 1;

  /**
   * Whether if the program failed to scrape the website.
   *
   * If all attempts failed to successfully scrape the website, this will be set
   * to true.
   */
  private failed = false;

  /**
   * Sets the puppeteer browser instance.
   *
   * @param browser The puppeteer browser instance.
   */
  public SetBrowserInstance(browser: Browser) {
    this.browser = browser;
  }

  /**
   * Returns the name of the website.
   *
   * The name of the website is used for logging purposes, such as when the
   * manager loads a website or when logging an error. The name is simply the
   * name of the child class.
   *
   * @returns The name of the website.
   */
  public GetName(): string {
    return this.constructor.name;
  }

  /**
   * Increases the current attempt number for scraping.
   */
  public IncreaseAttempts(): void {
    this.attemptNumber += 1;
  }

  /**
   * Sets the failed flag to true.
   */
  public SetFailed(): void {
    this.failed = true;
  }

  /**
   * Returns whether if the program failed to scrape the website.
   *
   * Represents whether if all attempts to scrape the website failed. If a
   * website fails, the manager will skip to the next website but will also
   * save the
   *
   * @returns
   */
  public Failed(): boolean {
    return this.failed;
  }

  /**
   * Delays the script for the specified amount of time.
   *
   * @param time The amount of time to wait in milliseconds.
   */
  public async Delay(time: number = this.delayAmount): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time * this.attemptNumber ** 2));
  }

  /**
   * Ensures that the website's respective directory exists.
   */
  public ResetDirectory(): void {
    if (existsSync(this.ROOT)) {
      rmSync(this.ROOT, { recursive: true });
    }

    mkdirSync(this.ROOT, { recursive: true });
  }

  /**
   * Returns all the files in the website's directory.
   *
   * @returns A list of all the files in the website's directory.
   */
  public GetDirectoryFiles(): string[] {
    return readdirSync(this.ROOT);
  }

  /**
   * Downloads a file from the page.
   *
   * @param page The page loaded at the website's URL.
   * @param Action The action that will trigger the download.
   * @returns The path to the downloaded file.
   */
  protected async Download(page: Page, Action: () => Promise<void>): Promise<string> {
    const before = this.GetDirectoryFiles();

    // @ts-ignore
    await page._client().send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: this.ROOT,
    });

    await Action();

    return new Promise((resolve, reject) => {
      // @ts-ignore
      page._client().on('Page.downloadProgress', (e) => {
        if (e.state === 'completed') {
          resolve(this.GetDirectoryFiles().filter((f) => !before.includes(f))[0]);
        } else if (e.state === 'canceled') {
          reject();
        }
      });
    });
  }

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
    return;
  }

  /**
   * The entry point for scraping the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public abstract Scrape(page: Page): Promise<void>;

  /**
   * Scrapes a row from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async ScrapeRow(row: ElementHandle<HTMLTableRowElement>): Promise<void> {
    return;
  }

  /**
   * Scrapes a table from the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async ScrapeTable(page: Page): Promise<void> {
    const rows = await this.GetTable(page);

    for (const row of rows) {
      await this.ScrapeRow(row);
    }
  }

  /**
   * Scrapes the website.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async ScrapePages(page: Page): Promise<void> {
    const fistIteration = await this.IsFinished(page);

    let isFinished = fistIteration.finished;
    let element = fistIteration.element;

    while (!isFinished) {
      await element!.click();
      await this.Delay();
      await this.ScrapeTable(page);

      const nextIteration = await this.IsFinished(page);

      isFinished = nextIteration.finished;
      element = nextIteration.element;
    }
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
    return { finished: true, element: null };
  }

  /**
   * Determines if the scraped data is valid and should be saved.
   *
   * @param data The scraped data.
   * @returns Whether if the data is valid.
   */
  public IsDataValid(data: SavedPermitDataStructure<City, State>): boolean {
    const text = [
      data.description?.toLowerCase(),
      data.permittypedescr?.toLowerCase(),
      data.comments?.toLowerCase(),
    ];

    return text.some((x) => {
      return x?.includes('demo') || x?.includes('build');
    });
  }

  /**
   * Saves the scraped data if it is valid.
   *
   * @param data The scraped data to save.
   */
  public Save(data: SavedPermitDataStructure<City, State>) {
    if (!this.IsDataValid(data)) {
      return;
    }

    this.data.push(data);
    this.PrintSuccess(`scraped permit ${data.permitnumber}`);
  }

  /**
   * Gets a reference to all the rows in the table.
   *
   * @param page A reference to the page that loaded the page that contains the
   * data to scrape.
   */
  public async GetTable(page: Page): Promise<ElementHandle<HTMLTableRowElement>[]> {
    return [];
  }

  /**
   * Cleans the scraped data.
   *
   * This takes the raw data scraped from the website and returns a cleaned
   * version.
   */
  public abstract GetData(): SavedPermitDataStructure<City, State>[];

  /**
   * Returns the current day.
   *
   * @returns The current day.
   */
  public GetDay() {
    return DATE.getDate();
  }

  /**
   * Returns the current month.
   *
   * @returns The current month.
   */
  public GetMonth() {
    return DATE.getMonth() + 1;
  }

  /**
   * Returns the current year.
   *
   * @returns The current year.
   */
  public GetYear(): number {
    return DATE.getFullYear();
  }

  /**
   * A helper method to print an info message.
   *
   * @param content The content of the log.
   * @param options Options for logging.
   * @example
   *
   * ```TypeScript
   * import { Logger } from '@norviah/logger';
   *
   * new Logger().info('sample text');
   * // => [ 01-01-1970 12:00 AM ] info: sample text
   * ```
   */
  public PrintInfo(content: string | string[], options?: Partial<LoggingOptions>): void {
    logger.print(content, {
      name: this.constructor.name,
      title: 'info',
      colors: { title: 'blue', ...options?.colors },
      both: true,
      ...options,
      write: false,
    });
  }

  /**
   * A helper method to print a success message.
   *
   * @param content The content of the log.
   * @param options Options for logging.
   * @example
   *
   * ```TypeScript
   * import { Logger } from '@norviah/logger';
   *
   * new Logger().success('sample text');
   * // => [ 01-01-1970 12:00 AM ] ok: sample text
   * ```
   */
  public PrintSuccess(content: string | string[], options?: Partial<LoggingOptions>): void {
    logger.print(content, {
      name: this.constructor.name,
      title: 'success',
      colors: { title: 'green', ...options?.colors },
      both: true,
      ...options,
      write: false,
    });
  }

  /**
   * A helper method to print a warning.
   *
   * @param content The content of the log.
   * @param options Options for logging.
   * @example
   *
   * ```TypeScript
   * import { Logger } from '@norviah/logger';
   *
   * new Logger().warn('sample text');
   * // => [ 01-01-1970 12:00 AM ] warning: sample text
   * ```
   */
  public PrintWarn(content: string | string[], options?: Partial<LoggingOptions>): void {
    logger.print(content, {
      name: this.constructor.name,
      title: 'warning',
      colors: { title: 'yellow', ...options?.colors },
      both: true,
      ...options,
    });
  }

  /**
   * A helper method to print an error.
   *
   * @param content The content of the log.
   * @param options Options for logging.
   * @example
   *
   * ```TypeScript
   * import { Logger } from '@norviah/logger';
   *
   * new Logger().error('sample text');
   * // => [ 01-01-1970 12:00 AM ] error: sample text
   * ```
   */
  public PrintError(content: string | string[], options?: Partial<LoggingOptions>): void {
    logger.print(content, {
      name: this.constructor.name,
      title: 'error',
      colors: { title: 'red', ...options?.colors },
      both: true,
      ...options,
    });
  }
}
