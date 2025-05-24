import { lstatSync, readdirSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { logger } from '@/utils/logger';
import { push } from './push';

import { Manager } from '@/structs/Manager';
import * as paths from '@/utils/paths';
import { backOff } from 'exponential-backoff';

const ignore = ['boston', 'brockton', 'weston', 'woburn', 'needham'];
const files = readdirSync(__dirname)
  .filter((f) => !ignore.includes(f))
  .map((f) => join(__dirname, f))
  .filter((f) => lstatSync(f).isDirectory());

const skipTo = '';
let skipped = false;

type File = {
  main: () => Promise<void>;
};

async function main() {
  for (const file of files) {
    const dirName = file.split(sep).pop()?.trim()!;

    if (skipTo.length > 0 && !skipped) {
      if (dirName !== skipTo) {
        continue;
      }

      skipped = true;
    }

    try {
      logger.info(`scraping ${dirName}`);
      const scrapeScript = require(join(__dirname, dirName, 'scrape.js')) as File;

      await backOff(
        async () => {
          await scrapeScript.main();
        },
        {
          numOfAttempts: 3,
          startingDelay: 5 * 1000,
          timeMultiple: 5,
          retry: async (error: Error, attemptNumber: number) => {
            logger.error(`scraping ${dirName} failed, retrying #${attemptNumber}`);
            return true;
          },
        },
      );

      logger.info(`pushing ${dirName}`);
      await push(join(paths.PERMITS, dirName, 'data.json'));

      logger.info(`${dirName} done\n`);
    } catch (e) {
      logger.error([`Error in ${dirName}: ${e}`, (e as Error).stack || '']);
    }
  }

  await new Manager().Start().catch((e) => logger.error((e as Error)?.message));
}

main();
