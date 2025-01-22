import * as pup from 'puppeteer';

import { browserConfig } from '@/utils/config';

async function main() {
  console.log('Launch browser');
  const browser = await pup.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    // dumpio: true,
    timeout: 0,
    // args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('Opening page');
  const page = await browser.newPage();
  await page.goto('https://google.com');
  await browser.close();

  // console.log('Go to page');

  // console.log('Close browser');
  // await browser.close();
}

main();
