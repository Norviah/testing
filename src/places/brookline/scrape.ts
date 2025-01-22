import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { launch } from 'puppeteer';

import type { SavedPermitDataStructure } from '@/types';
import { browserConfig } from '@/utils/config';
import * as paths from '@/utils/paths';
import type * as puppaeteer from 'puppeteer';
import {
  type AllSections,
  importApplicantSection,
  importLicensedProfessionalSection,
  importMoreDetailSection,
  importOwnerSection,
} from './utils';

const downloadsPath = join(homedir(), 'Downloads');
const downloadsFile = readdirSync(downloadsPath);

const bigDelay = 5000;
const smallDelay = 3000;
const exported: SavedPermitDataStructure<'Brookline', 'MA'>[] = [];

async function hi(page: puppaeteer.Page) {
  const aca = await page.$('#aca');
  const iframe = await aca!.$('iframe');
  const frame = await iframe!.contentFrame();
  const body = await frame!.$('body');

  return body;
}

async function hi2(page: puppaeteer.Page) {
  await new Promise((resolve) => setTimeout(resolve, bigDelay));
  const body = await page.$('body');
  const form = await body!.$('form');
  const wrapper = await form!.$('.aca_wrapper');
  const content = await wrapper!.$('div');

  return content;
}

export type Report = AllSections & {
  permitnumber?: string;
  description?: string;
  issued_date?: string;
  status?: string;
  parcel_id?: string;
  occupancytype?: string;
};

async function data(
  page: puppaeteer.Page,
): Promise<SavedPermitDataStructure<'Brookline', 'MA'> | false> {
  await new Promise((resolve) => setTimeout(resolve, bigDelay));
  const body = await hi2(page);

  const table = await body!.$('#ctl00_PlaceHolderMain_PermitDetailList1_TBPermitDetailTest');
  const sections = await table!.$$('.td_parent_left');

  const permitNumber = await body?.$('#ctl00_PlaceHolderMain_lblPermitNumber');
  const permitNumberText = await permitNumber!.evaluate((el) => el.textContent?.trim());

  // let object = {} as Report;
  let object = {} as SavedPermitDataStructure<'Brookline', 'MA'>;

  const moreDetailContainer = await body!.$('#TRMoreDetail');
  const moreDetailBody = await moreDetailContainer!.$('tbody');
  const moreDetailBlockContent = await moreDetailBody!.$('.MoreDetail_BlockContent');
  const moreDetailContentContainer = await moreDetailBlockContent!.$('div');
  const moreDetailBlocks = await moreDetailContentContainer!.$$('div');
  const moreDetailObject = await importMoreDetailSection(moreDetailBlocks);

  // await new Promise((resolve) => setTimeout(resolve, 100000));

  // if (!moreDetailObject.isDemo) {
  //   await page.close();
  //   return false;
  // }

  for (const section of sections) {
    const textContent = await section.evaluate((el) => el.textContent?.trim());

    if (textContent?.toLowerCase().includes('licensed professional')) {
      const data = await importLicensedProfessionalSection(section);
      object = { ...object, ...data };
    }

    if (textContent?.toLowerCase().includes('applicant')) {
      const applicantBody = await section!.$('tbody');
      const applicantSectionObject = await importApplicantSection(applicantBody);
      object = { ...object, ...applicantSectionObject };
    }

    if (textContent?.toLowerCase().includes('project description')) {
      const projectDescriptionBody = await section!.$('tbody');
      const projectDescription = await projectDescriptionBody!.evaluate((el) =>
        el.textContent?.trim(),
      );
      object = { ...object, description: projectDescription };
    }

    if (textContent?.toLowerCase().includes('owner')) {
      const ownerSectionBody1 = await section?.$('tbody');
      const ownerSectionBody2 = await ownerSectionBody1?.$('tbody');
      const ownerSectionBody3 = await ownerSectionBody2?.$('tbody');
      const ownerSectionObject = ownerSectionBody3
        ? await importOwnerSection(ownerSectionBody3)
        : {};
      object = { ...object, ...ownerSectionObject };
    }
  }

  object = { ...object, ...moreDetailObject, permitnumber: permitNumberText! };

  const parcelList = await body!.$('#ctl00_PlaceHolderMain_PermitDetailList1_tbParcelList');
  const parcelListBody = await parcelList!.$('tbody');
  const divs = await parcelListBody!.$$('div');

  for (const div of divs) {
    const textContent = await div.evaluate((el) => el.textContent?.trim());

    if (textContent?.toLowerCase().includes('parcel number')) {
      object.parcel_id = textContent?.split(':')[1].trim();
    } else if (textContent?.toLowerCase().includes('zoning')) {
      object.occupancytype = textContent?.split(':')[1].trim();
    }
  }

  await page.close();
  return object;
}

export async function main(): Promise<void> {
  const browser = await launch({ ...browserConfig });
  // const browser = await launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Close any tabs that aren't the one we created on the line above
  for (const p of await browser.pages()) {
    if (p !== page) {
      await p.close();
    }
  }

  await page.goto('https://aca-prod.accela.com/Brookline/Default.aspx', { timeout: 0 });
  let body = await hi(page);

  const links = await body!.$$('a');
  for (const link of links) {
    const text = await link.evaluate((el) => el.textContent);
    if (text === 'Search Applications') {
      await link.click();
      break;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, smallDelay));
  body = await hi(page);
  await new Promise((resolve) => setTimeout(resolve, smallDelay));

  const select = await body!.$$('select');
  await select[1].select('Building/1&2 Family/Residential/NA');

  await new Promise((resolve) => setTimeout(resolve, smallDelay));

  const xName = 'ctl00$PlaceHolderMain$generalSearchForm$txtGSStartDate';
  const id = 'ctl00_PlaceHolderMain_generalSearchForm_txtGSStartDate';

  const inputs = await body!.$$('input');
  for (const input of inputs) {
    const value = await input.evaluate((el) => el.getAttribute('value'));
    const name = await input.evaluate((el) => el.getAttribute('name'));

    if (name === xName) {
      const [month, oldDay, year] = value!.split('/');

      const today = new Date();
      const todayDayNumber = today.getDate();
      const todayMonthNumber = today.getMonth() + 1;

      const newDay = todayDayNumber - 10;
      const newDate = `${String(todayMonthNumber).padStart(2, '0')}/${
        newDay < 0 ? '01' : String(newDay).padStart(2, '0')
      }/2024`;
      // const newDate = `${month}/01/2024`;

      // clear input
      for (let i = 0; i < 25; i++) {
        await input.press('Backspace');
      }
      await input.type(newDate, { delay: 20 });
    }
  }

  await new Promise((resolve) => setTimeout(resolve, smallDelay));
  const button = await body!.$('#ctl00_PlaceHolderMain_btnNewSearch');
  await button!.click();

  await body!.$$eval('a', (buttons) => {
    for (const button of buttons) {
      if (button.textContent === 'Search') {
        button.click();
        break; // Clicking the first matching button and exiting the loop
      }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, bigDelay));

  let finished = false;
  do {
    body = await hi(page);
    finished = await readTable(browser, body!);
    if (!finished) {
      console.log('next page');
    }
    await new Promise((resolve) => setTimeout(resolve, smallDelay));
  } while (!finished);

  console.log('done');
  await page.close();
  await browser.close();

  if (!existsSync(paths.BROOKLINE)) {
    mkdirSync(paths.BROOKLINE, { recursive: true });
  }

  writeFileSync(paths.BROOKLINE_DATA, JSON.stringify(exported, null, 2));
  console.log(`saved to ${paths.BROOKLINE_DATA}`);
}

async function readTable(
  browser: puppaeteer.Browser,
  body: puppaeteer.ElementHandle<HTMLBodyElement>,
): Promise<boolean> {
  const table = await body!.$('#ctl00_PlaceHolderMain_dgvPermitList_gdvPermitList');
  const tableBody = await table!.$('tbody');
  const rows = await await tableBody!.$$('tr');

  for (const [i, row] of rows.entries()) {
    const cells = await row!.$$('td');

    // hard code check for cells length to only get the rows with data
    if (cells.length !== 10) {
      continue;
    }

    // checkbox, date, record number, record type, action, address, description, status, expiration date, hidden column

    const link = await cells[2].$('a');
    const date = await cells[1].evaluate((el) => el.textContent?.trim());
    const status = await cells[7].evaluate((el) => el.textContent?.trim());
    const recordNumber = await cells[2].evaluate((el) => el.textContent?.trim());

    if (link) {
      // check if the record number is in the form of: WW-YYYY-NNNNNN
      if (!recordNumber || !/^\w{2}-\d{4}-\d{6}$/.test(recordNumber)) {
        continue;
      }

      // await link.click({ button: 'middle' });
      const target = await Promise.all([
        new Promise((resolve) => browser.once('targetcreated', resolve)),
        link.click({ button: 'middle' }),
      ]).then(([target]) => target as puppaeteer.Target);

      const newPage = await target.page();
      await newPage!.bringToFront();
      // await newPage!.waitForNavigation();

      const objec = await data(newPage!);

      if (objec === false) {
        console.log(`skipped ${recordNumber}`);
      } else {
        exported.push({
          ...objec,
          issued_date: date,
          status: status,
        });
        console.log(`downloaded ${recordNumber}`);
      }
    }
  }

  const paginationButtonsContainer = await body.$('.aca_pagination');

  if (!paginationButtonsContainer) {
    return true;
  }

  const buttons = await paginationButtonsContainer.$$('td');
  const nextButton = buttons[buttons.length - 1];

  // has more pages if there is an anchor element
  const anchor = await nextButton.$('a');

  if (anchor) {
    await nextButton.click();
    return false;
  }

  return true;
}
