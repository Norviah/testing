import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { launch } from 'puppeteer';

import type { SavedPermitDataStructure } from '@/types';
import { browserConfig } from '@/utils/config';
import * as paths from '@/utils/paths';
import type { ElementHandle } from 'puppeteer';
import type * as puppeteer from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 5000;

export type Record = {
  permitnumber: string;
  worktype?: string;
  description?: string;
  city: 'Norwood';
  state: 'MA';
  zip?: string;
  address?: string;
  status?: string;
  issued_date?: string;
  expiration_date?: string;
  applicant?: string;
  permittypedescr?: string;
  total_fees?: string;
  owner?: string;

  applicant_email_address?: string;

  estimated_cost_of_construction?: string;
  owner_company?: string;
  applied_date?: string;
  finalized_date?: string;

  // comments: string;
  // declared_valuation: string;
  // occupancytype: string;
  // sq_feet: string;
  // property_id: string;
  // parcel_id: string;
  // gpsy: string;
  // gpsx: string;
  // y_latitude: string;
  // x_longitude: string;
};

type D = SavedPermitDataStructure<'Norwood', 'MA'>;
const exported: D[] = [];

async function data(page: puppeteer.Page): Promise<Record> {
  await new Promise((resolve) => setTimeout(resolve, bigDelay));

  const permitnumber = await page.$('#focusText');
  const permitnumberTextContainer = await permitnumber?.$('span');
  const permitnumberText = await permitnumberTextContainer?.evaluate((el) => el.textContent);

  const data: Record = { permitnumber: permitnumberText!, city: 'Norwood', state: 'MA' };

  const permitDetailType = await page.$('#label-PermitDetail-Type');
  const permitDetailTypeTextContainer = await permitDetailType?.$('p');
  const text = await permitDetailTypeTextContainer?.evaluate((el) => el.textContent);
  data.permittypedescr = text || undefined;

  const status = await page.$('#label-PermitDetail-Status');
  const statusTextContainer = await status?.$('p');
  const statusText = await statusTextContainer?.evaluate((el) => el.textContent);
  data.status = statusText || undefined;

  const appliedDate = await page.$('#label-PermitDetail-ApplicationDate');
  const appliedDateTextContainer = await appliedDate?.$('p');
  const appliedDateText = await appliedDateTextContainer?.evaluate((el) => el.textContent);
  data.applied_date = appliedDateText || undefined;

  const issuedDate = await page.$('#label-PermitDetail-IssuedDate');
  const issuedDateTextContainer = await issuedDate?.$('p');
  const issuedDateText = await issuedDateTextContainer?.evaluate((el) => el.textContent);
  data.issued_date = issuedDateText || undefined;

  const applicant = await page.$('#label-PermitDetail-AssignedTo');
  const applicantTextContainer = await applicant?.$('p');
  const applicantContainer = await applicantTextContainer?.$('tyler-staff-email');
  data.applicant_email_address =
    (await applicantContainer?.evaluate((el) => el.getAttribute('staff-email'))) || undefined;
  data.applicant =
    (await applicantContainer?.evaluate((el) => el.getAttribute('staff-name'))) || undefined;

  const expirationDate = await page.$('#label-PermitDetail-ExpirationDate');
  const expirationDateTextContainer = await expirationDate?.$('p');
  const expirationDateText = await expirationDateTextContainer?.evaluate((el) => el.textContent);
  data.expiration_date = expirationDateText || undefined;

  const finalizedDate = await page.$('#label-PermitDetail-FinalizedDate');
  const finalizedDateTextContainer = await finalizedDate?.$('p');
  const finalizedDateText = await finalizedDateTextContainer?.evaluate((el) => el.textContent);
  data.finalized_date = finalizedDateText || undefined;

  const description = await page.$('#label-PermitDetail-Description');
  const descriptionText = await description?.evaluate((el) => el.textContent);
  data.description = descriptionText ?? undefined;

  const address = await page.$('#Address_State_Info_0');
  const textC = await address?.evaluate((el) => el.textContent);
  const [addressText, CityStateText, Zip] = textC?.trim().split('\n') || [];
  data.address = addressText?.trim();
  data.city = 'Norwood';
  data.state = 'MA';
  data.zip = Zip && /\d/.test(Zip) ? Zip.trim().replace(/[^0-9]+/g, '') : undefined;

  // const totalFees = await page.$('#feeSummary-TotalFee');
  // const totalFeesTextContainer = await totalFees?.$('p');
  // const totalFeesText = await totalFeesTextContainer?.evaluate((el) => el.textContent);
  // data.total_fees = totalFeesText || undefined;

  const contactsTable = await page.$('#selfServiceTable-Contacts');
  const contactsBody = await contactsTable?.$('tbody');
  const contactsRows = await contactsBody?.$$('tr');
  for (const row of contactsRows || []) {
    const textContent = await row.evaluate((el) => el.textContent);
    if (!textContent?.toLowerCase().includes('property owner')) {
      continue;
    }

    const columns = await row.$$('td');
    const [type, company, firstName, lastName, title, confirmation, billing, remove] = columns;

    const companyText = await company?.evaluate((el) => el.textContent);
    const firstNameText = await firstName?.evaluate((el) => el.textContent);
    const lastNameText = await lastName?.evaluate((el) => el.textContent);

    data.owner = `${firstNameText} ${lastNameText}`.trim() || undefined;
    data.owner_company = companyText || undefined;
  }

  const estimatedCost = await page.$('#ESTIMATEDCOSTOFCONSTRUCTI');
  const estimatedCostText = await estimatedCost?.evaluate((el) => el.textContent);
  data.total_fees = estimatedCostText?.trim().replace(/\s|\n/g, '').split(':')[1] || undefined;

  await page.close();
  return data;
}

async function getBody(page: puppeteer.Page) {
  const body = await page.$('body');
  const wrapper = await body!.$('#wrapper');
  const pageContentWrapper = await wrapper!.$('#page-content-wrapper');
  const content = await pageContentWrapper!.$('#pageContainer');

  return content;
}

export async function main(): Promise<void> {
  const browser = await launch(browserConfig);
  const page = await browser.newPage();

  // Close any tabs that aren't the one we created on the line above
  for (const p of await browser.pages()) {
    if (p !== page) {
      await p.close();
    }
  }

  await page.goto('https://energovweb.norwoodma.gov/EnerGov_Prod/SelfService#/search', {
    timeout: 0,
  });

  await new Promise((resolve) => setTimeout(resolve, bigDelay));
  // const body = await page.$('body');
  // const wrapper = await body!.$('#wrapper');
  // const pageContentWrapper = await wrapper!.$('#page-content-wrapper');
  // const content = await pageContentWrapper!.$('#pageContainer');

  let content = await getBody(page);

  await new Promise((resolve) => setTimeout(resolve, bigDelay));

  const element = await content!.$('#SearchModule');
  await element!.select('number:2');

  const advancedButton = await content!.$('#button-Advanced');
  await advancedButton!.click();

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  // const desiredDay = day - 7 < 0 ? 0 : day - 7;
  const desiredDay = 1;
  const thisYear = today.getFullYear();

  // const applyDateFrom = await content!.$('#ApplyDateFrom');
  // await applyDateFrom!.type(`${month}/${desiredDay}/2024`, { delay: 20 });
  const issuedDateInput = await content!.$('#IssueDateFrom');
  await issuedDateInput!.type(`${month}/${desiredDay}/${thisYear}`, { delay: 20 });

  const searchButton = await content!.$('#button-Search');
  await searchButton!.click();
  await new Promise((resolve) => setTimeout(resolve, bigDelay));
  const pageSizeList = (await content!.$(
    '#pageSizeList',
  )) as ElementHandle<HTMLSelectElement> | null;
  await pageSizeList!.select('100');
  await new Promise((resolve) => setTimeout(resolve, smallDelay));

  let finished = false;
  do {
    content = await getBody(page);
    finished = await readTable(browser, content!);
    if (!finished) {
      // console.log('next page');
    }
    await new Promise((resolve) => setTimeout(resolve, bigDelay));
  } while (!finished);

  // console.log('done');
  await page.close();
  await browser.close();

  if (!existsSync(paths.NORWOOD)) {
    mkdirSync(paths.NORWOOD, { recursive: true });
  }

  writeFileSync(paths.NORWOOD_DATA, JSON.stringify(exported, null, 2));
  // console.log(`saved to ${paths.NORWOOD_DATA}`);
}

async function readTable(
  browser: puppeteer.Browser,
  content: puppeteer.ElementHandle<Element>,
): Promise<boolean> {
  const rowContainer = await content!.$('.row');
  const row = await rowContainer!.$('.col-md-10');
  const rows = await row!.$$('[name="label-SearchResult"]');

  for (const row of rows) {
    const permitNumberContainer = await row.$('[name="label-CaseNumber"]');
    const permitNumberTextContainer = await permitNumberContainer!.$('span');
    const permitNumberText = await permitNumberTextContainer!.evaluate((el) => el.textContent);

    const caseTypeContainer = await row.$('[name="label-CaseType"]');
    const caseTypeTextContainer = await caseTypeContainer!.$('span');
    const caseTypeText = await caseTypeTextContainer!.evaluate((el) => el.textContent);

    if (!caseTypeText?.toLowerCase().includes('building')) {
      continue;
    }

    const link = await permitNumberContainer!.$('a');

    const target = await Promise.all([
      new Promise((resolve) => browser.once('targetcreated', resolve)),
      link!.click({ button: 'middle' }),
    ]).then(([target]) => target as puppeteer.Target);

    const newPage = await target.page();
    await newPage!.bringToFront();
    const object = await data(newPage!);
    exported.push(object);
    // console.log(`saved ${permitNumberText}`);
  }

  const paginationButtonsContainer = await content.$('#paginationList');

  if (!paginationButtonsContainer) {
    return true;
  }

  const buttons = await paginationButtonsContainer.$$('li');
  // const previousButton = buttons[1];
  const nextButton = buttons[buttons.length - 2];

  if (!nextButton) {
    return true;
  }

  const attr = await nextButton.evaluate((el) => el.getAttribute('class'));
  if (attr !== 'disabled') {
    const a = await nextButton.$('a');
    await a!.click();
    return false;
  }

  return true;
}
