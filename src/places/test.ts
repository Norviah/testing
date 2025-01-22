import { lstatSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { logger } from '@/utils/logger';
import { push } from './push';

import * as paths from '@/utils/paths';

const ignore = ['brockton', 'weston'];
const files = readdirSync(__dirname)
  .filter((f) => !ignore.includes(f))
  .map((f) => join(__dirname, f))
  .filter((f) => lstatSync(f).isDirectory());

type File = {
  main: () => Promise<void>;
};

async function main() {
  const dirName = 'brookline';

  try {
    // logger.info(`scraping ${dirName}`);
    // const scrapeScript = require(join(file, 'scrape.js')) as File;
    // await scrapeScript.main();

    // logger.info(`\npushing ${dirName}`);
    // const pushScript = require(join(file, 'push.js')) as File;
    // await pushScript.main();
    // // await push(dirName!);

    // logger.info(`\n${dirName} done\n`);

    // logger.info(`scraping ${dirName}`);
    // const scrapeScript = require(join(__dirname, dirName, 'scrape.js')) as File;
    // await scrapeScript.main();

    logger.info(`pushing ${dirName}`);
    await push(join(paths.PERMITS, dirName, 'data.json'));

    logger.info(`${dirName} done\n`);
  } catch (e) {
    logger.error([`Error in ${dirName}: ${e}`, (e as Error).stack || '']);
    throw e;
  }
}

main();
