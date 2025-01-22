import {
  existsSync,
  mkdirSync,
  readFile,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { waitForDownload } from '@/utils/helpers';
import { PDFDict, PDFDocument, asPDFName } from 'pdf-lib';

import puppateer, { ElementHandle, Frame, Page } from 'puppeteer';

import { SavedPermitDataStructure } from '@/types';
import * as paths from '@/utils/paths';
import { backOff } from 'exponential-backoff';

// async function getBody(page: Page) {
async function getBody(page: ElementHandle<any> | Page) {
  const iframe = await page.waitForSelector('iframe');
  const frame = await iframe!.contentFrame();
  const name = await iframe!.evaluate((e) => e.getAttribute('name'));
  console.log(name);
  const body = await frame!.$('body');

  return body;
}

// export type Data = {
//   permitnumber: string;
//   address: string;
//   city: 'Weston';
//   state: 'MA';
//   description: string;
//   permittypedescr: string;
//   total_fees: string;
//   zip: string;
//   owner: string;
//   owner_phone_number: string;
//   owner_email: string;
//   link: string;
// };

export type Data = SavedPermitDataStructure<'Weston', 'MA'>;

async function scrape(): Promise<void> {
  if (!existsSync(paths.WESTON)) {
    mkdirSync(paths.WESTON, { recursive: true });
  }

  // const browser = await puppateer.launch({ headless: false });
  const browser = await puppateer.launch({
    headless: false,
    // executablePath: '/usr/bin/chromium-browser',
    // args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  await page.goto('https://www.mapsonline.net/westonma/public_permit_reports.html.php');

  const body = await getBody(page);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const g = await body!.$('.ui.segment.control-group__pLkyg');
  const listBox = await g!.$('[role="listbox"]');
  await listBox!.click();

  const options = await listBox!.$$('div[role="option"]');
  await options[6].click();

  const submitButton = await body!.$('button.ui.primary.button');
  await submitButton!.click();

  await new Promise((resolve) => setTimeout(resolve, 5000));

  //

  // const body2 = (await getBody(body!))!;

  // const iframe2 = await body!.waitForSelector('iframe');
  // const frame2 = await iframe2!.contentFrame();
  // const name = await iframe2!.evaluate((e) => e.getAttribute('name'));
  // console.log(name);
  // const body2 = await frame2!.$('body');

  // console.log(await page.$('#icon'));
  // console.log(await frame2.$('#icon'));
  // console.log(await body2!.$('#icon'));

  // const iframe3 = await frame2!.waitForSelector('iframe');
  // console.log(iframe3);

  // for (let y = 0; y < 5000; y += 5) {
  // for (let y = 0; y < 500; y += 5) {
  //   for (let x = 0; x < 5000; x += 5) {

  // for (let y = 60; y < 500; y += 5) {
  //   for (let x = 0; x < 3000; x += 5) {

  // for (let x = 650; x < 700; x += 5) {
  //   console.log('clicking', x, 75);
  //   await page.mouse.click(x, 75);

  //   // console.log(y / 5 / 60 + '% done');
  //   await new Promise((resolve) => setTimeout(resolve, 1500));
  // }

  // @ts-ignore
  await page._client().send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: paths.WESTON,
  });

  await page.mouse.click(660, 75);
  await waitForDownload(page);

  console.log(`downloaded to ${paths.WESTON}`);
  await browser.close();

  // x
  // :
  // 306
  // y
  // :
  // 18

  // await page.mouse.click(306, 18);

  // // get first children
  // const c = await body2!.$('*');
  // console.log(c);

  // const iframe = await body2!.$('iframe');
  // const frame = await iframe!.contentFrame();
  // const body3 = await frame!.$('body');

  // console.log(body3);

  // const body2 = await getBody(page);
  // const iframe2 = await body2!.$('iframe');
  // const frame2 = await iframe2!.contentFrame();
  // const body3 = await frame2!.$('body');
  // const c = await body3!.$('#download');
  // console.log(c);

  //

  // const name = await iframe2!.evaluate((e) => e.getAttribute('name'));
  // console.log(name);

  // const body2 = await getBody(page);
  // const downloadButton = await body2!.$('div#icon');
  // await downloadButton!.click();
  // const reactRoot = await body2!.$('#react-root');

  // const reactRoot = await body!.$('#react-root');
  // const iframe2 = await reactRoot!.$('iframe');
  // const frame2 = await iframe2!.contentFrame();
  // const frameSource = await iframe2!.evaluate((e) => e.getAttribute('src'));
  // console.log(frame2);
  // console.log(frameSource);
  // const body2 = await frame2!.$('body');
  // const pdfViewer = await body2!.$('pdf-viewer');
  // console.log(pdfViewer);

  // const inputs = await body!.$$('input');
  // console.log(inputs);
  // await inputs[inputs.length - 1].click();

  // const listBox = await body!.$('div[role="listBox"]');
  // console.log(listBox);
  // await listBox!.click();
}

// Function to fetch the PDF file
async function fetchPdf(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Function to extract links from a PDF
async function extractLinksFromPdf(pdfUrl: string) {
  const file = readFileSync(pdfUrl);
  const pdfDoc = await PDFDocument.load(file);

  const links: string[] = [];

  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const n = page.node.Annots()?.asArray();

    for (const a of n || []) {
      const dict = pdfDoc.context.lookupMaybe(a, PDFDict);
      const aRecord = dict!.get(asPDFName('A'));
      const link = pdfDoc.context.lookupMaybe(aRecord, PDFDict);
      const uri = link!.get(asPDFName('URI'))!.toString().slice(1, -1); // get the original link, remove parenthesis

      // if (uri.startsWith('https://www.mapsonline.net/westonma/forms/pdfViewer.html?')) {
      if (uri.startsWith('https://www.mapsonline.net/westonma')) {
        links.push(uri);
      }
      // if (uri.startsWith('http')) {
      //   link!.set(asPDFName('URI'), PDFString.of(/*Wathever value*/)); // update link value}
      // }
    }
  }

  return links;
}

export async function main() {
  await scrape();
  const links = await extractLinksFromPdf(join(paths.WESTON, 'reports.pdf'));

  // const browser = await puppateer.launch({
  //   headless: false,
  //   product: 'firefox',
  //   // args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
  // });

  const browser = await puppateer.launch({
    headless: true,
    product: 'firefox',
    // executablePath: '/usr/bin/chromium-browser',
    // args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  const data = [] as Data[];

  // console.log();
  // await page.goto(join(paths.WESTON, 'PDF.js viewer.pdf'));

  for (const [i, link] of links.entries()) {
    const id = link.split('jump=')[1];

    await page.goto(link);
    await new Promise((resolve) => setTimeout(resolve, 10000));

    try {
      const d = await backOff(() => scrapePage(page), {
        numOfAttempts: 3,
        startingDelay: 1000,
        timeMultiple: 1.25,
        retry: (e, attemptNumber) => {
          console.log(`retrying link ${link}: attempt ${attemptNumber}`);

          return true;
        },
      });

      // const d = await scrapePage(page);
      console.log(`scraped ${link} ${i + 1}/${links.length}`);
      data.push({ ...d, permitnumber: id, link });
      writeFileSync(join(paths.WESTON, 'data.json'), JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('link', link);
      console.log('error', e);
      // throw e;
    }
  }

  console.log('finished');
}

async function scrapePage(page: Page): Promise<Data> {
  // await dumpFrameTree(page.mainFrame(), '');

  // async function dumpFrameTree(frame: Frame, indent: string) {
  //   console.log(indent + frame.url());

  //   const text = await frame.$eval('*', (element) => element.textContent);
  //   console.log(text);
  //   for (const child of frame.childFrames()) {
  //     dumpFrameTree(child, indent + '  ');
  //   }
  // }

  // // const body = await page.$('body');

  const frame = await page.waitForSelector('iframe');
  const frameContent = await frame!.contentFrame();
  const framesrc = await frame!.evaluate((e) => e.getAttribute('src'));

  const body = await frameContent?.$('body');
  const outerContainer = await body?.$('#outerContainer');
  const mainContainer = await outerContainer?.$('#mainContainer');
  const viewerContainer = await mainContainer?.$('#viewerContainer');
  const viewer = await viewerContainer?.$('#viewer');
  const pages = (await viewer?.$$('.page')) || [];

  const textLayer = await pages[0].$('.textLayer');
  const spans = await textLayer!.$$('span');

  const text = [] as string[];

  for (const span of spans) {
    const t = (await span.evaluate((e) => e.textContent))!.trim();

    if (t !== '') {
      text.push(t);
    }
  }

  function keepGettingValuesUntilAnotherTitle({ i, array }: { i: number; array: string[] }) {
    const values = [] as string[];

    for (let j = i + 1; j < array.length; j++) {
      const t = array[j];

      // if (t.toLowerCase().includes(header.toLowerCase())) {
      if (t.includes(':')) {
        break;
      }

      values.push(t);
    }

    return values;
  }

  const object: Partial<Data> = {};

  for (const [i, t] of text.entries()) {
    if (t.toLowerCase().includes('Address:'.toLowerCase())) {
      object.address = keepGettingValuesUntilAnotherTitle({
        i,
        array: text,
      }).join(' ');
    }

    object.city = 'Weston';
    object.state = 'MA';

    if (t.toLowerCase().includes('Project Category:'.toLowerCase())) {
      object.permittypedescr = text[i + 1];
    }

    if (t.toLowerCase().includes('Description of work:'.toLowerCase())) {
      object.description = text[i + 1];
    }

    if (t.toLowerCase().includes('otal Cost ($) (calculated):'.toLowerCase())) {
      object.total_fees = text[i + 1];
    }

    if (t.toLowerCase().includes('property zip code:'.toLowerCase())) {
      object.zip = text[i + 1];
    }

    if (t.toLowerCase().includes('HomeOwner Name'.toLowerCase())) {
      object.owner = text[i + 1];
    } else if (t.toLowerCase().includes('property owner contact first name'.toLowerCase())) {
      const firstName = text[i + 1];
      const lastName = text[i + 4];

      object.owner = `${firstName} ${lastName}`;
    }

    if (
      t.toLowerCase().includes('REGISTERED PHONE'.toLowerCase()) ||
      t.toLowerCase().includes('property owner contact phone'.toLowerCase())
    ) {
      object.owner_phone_number = text[i + 1];
    }

    if (t.toLowerCase().includes('Registered Email'.toLowerCase())) {
      object.owner_email_address = text[i + 1];
    }
  }

  return object as Data;
}
