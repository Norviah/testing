import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { browserConfig, config } from '@/utils/config';
import { launch } from 'puppeteer';

import * as paths from '@/utils/paths';

import type { SavedPermitDataStructure } from '@/types';
import type { ElementHandle } from 'puppeteer';
import type * as puppeteer from 'puppeteer';

const bigDelay = 10000;
const smallDelay = 1000;

const exported: Data[] = [];

// export type Data = {
//   permitnumber: string;
//   city: 'Milton';
//   state: 'MA';
//   issued_date?: string;
//   owner?: string;
//   owner_phone_number?: string;
//   zone?: string;
//   applicant_address?: string;
//   applicant_city?: string;
//   applicant_state?: string;
//   applicant_zip?: string;
//   applicant_mobile_number?: string;
//   applicant_email_address?: string;
//   applicant?: string;
//   total_fees?: string;
//   address?: string;
//   status?: string;
//   description?: string;
//   property_id?: string;
//   permittypedescr?: string;
//   worktype?: string;
//   expiration_date?: string;
//   sq_feet?: string;
//   occupancytype?: string;
//   zip?: string;
// };

export type Data = SavedPermitDataStructure<'Milton', 'MA'>;

export async function main(): Promise<void> {
  const browser = await launch(browserConfig);
  const page = await browser.newPage();

  // Close any tabs that aren't the one we created on the line above
  for (const p of await browser.pages()) {
    if (p !== page) {
      await p.close();
    }
  }

  await page.goto('https://permiteyes.us/milton/publicview.php', {
    timeout: 0,
  });

  await new Promise((resolve) => setTimeout(resolve, smallDelay));

  const selectElement = await page!.$('#application_type');
  await selectElement?.select('a404b5a6-1869-11e7-8252-00e04c500937');

  const appliedDate = await page.$('[name="icon-daterange1"]');
  await appliedDate?.click();

  const [appliedDatePicker, issueDatePicker] = await page.$$('.daterangepicker');

  const [, , , applLast30Days, ,] = await appliedDatePicker?.$$('li');
  await applLast30Days?.click();

  const issueDate = await page.$('[name="icon-daterange2"]');
  await issueDate?.click();

  const [, , , issueLast30Days, ,] = await issueDatePicker?.$$('li');
  await issueLast30Days?.click();

  await new Promise((resolve) => setTimeout(resolve, smallDelay));

  const table = await page.$('#PublicHome');
  const tableBody = await table?.$('tbody');

  let finished = false;
  do {
    finished = await readTable(page, tableBody!);
  } while (!finished);

  await page.close();
  await browser.close();
  // console.log('done');

  if (!existsSync(paths.MILTON)) {
    mkdirSync(paths.MILTON, { recursive: true });
  }

  writeFileSync(paths.MILTON_DATA, JSON.stringify(exported, null, 2));
}

async function readTable(
  page: puppeteer.Page,
  tableBody: ElementHandle<Element> | null,
): Promise<boolean> {
  let rows = await tableBody?.$$('tr');
  let rowCount = 0;

  while (rowCount < rows!.length) {
    // const columns = await rows![rowCount].$$('td');
    // const firstColumn = columns[0];
    const [
      firstColumn,
      permit,
      insp,
      appNumber,
      appliedDate,
      issuedDate,
      siteAddress,
      applicant,
      owner,
      briefDescription,
      appliedType,
      permitNumberr,
      appliedStatus,
    ] = await rows![rowCount].$$('td');

    const appDataButton = await firstColumn.$('a');
    await appDataButton?.click();

    await new Promise((resolve) => setTimeout(resolve, smallDelay));

    const permitNumber = await GetValue(page, '#PermitNumber');
    const data: Data = { permitnumber: permitNumber!, city: 'Milton', state: 'MA' };
    data.issued_date = await GetValue(page, '#IssueDate');
    data.description = (await briefDescription?.evaluate((el) => el.textContent)) || undefined;
    data.status = (await appliedStatus?.evaluate((el) => el.textContent)) || undefined;
    data.worktype = (await appliedType?.evaluate((el) => el.textContent)) || undefined;
    data.occupancytype = await GetValue(page, '#CurrentUse');
    data.sq_feet = await GetValue(page, '#SquareAreaWork');

    const labelForDemotion = await page.$('label[for="Demolition"]');
    const check = await labelForDemotion?.$('.check');
    let isDemo = false;

    if (check) {
      // check height and width of input

      // // console.log(permitNumber);
      const boundingBox = await check.boundingBox();

      if (boundingBox && boundingBox?.width > 21 && boundingBox?.height > 21) {
        // console.log('DEMO');
        isDemo = true;
      }
    }
    data.isDemo = isDemo;

    // if (!isDemo) {
    //   // console.log(`skipped: ${permitNumber}`);
    //   rows = await tableBody?.$$('tr');
    //   rowCount++;

    //   continue;
    // }

    const streetName = await GetValue(page, '#OwnerStName');
    const streetNumber = await GetValue(page, '#OwnerStNum');
    data.address = streetName && streetNumber ? `${streetNumber} ${streetName}` : undefined;
    data.zip = await GetValue(page, '#OwnerZip');
    data.owner = await GetValue(page, '#OwnerName');
    data.owner_phone_number = await GetValue(page, '#OwnerPhone');
    data.zone = await GetValue(page, 'input[name="Zone"]');

    const applicantStreetNumber = await GetValue(page, '#AppStNum');
    const applicantStreetName = await GetValue(page, '#AppStName');
    data.applicant = await GetValue(page, '#AppName');
    data.applicant_address =
      applicantStreetName && applicantStreetNumber
        ? `${applicantStreetNumber} ${applicantStreetName}`
        : undefined;
    data.applicant_city = await GetValue(page, '#AppCity');
    data.applicant_state = await GetValue(page, '#AppState');
    data.applicant_zip = await GetValue(page, '#AppZip');
    data.applicant_mobile_number = await GetValue(page, '#AppPhone');
    data.applicant_email_address = await GetValue(page, '#AppEmail');

    // data.contractor_name = await getInputValue(page, '#HICName');
    // const contractorStreetNumber = await getInputValue(page, '#HICStNum');
    // const contractorStreetName = await getInputValue(page, '#HICStName');
    // data.contractor_address =
    //   contractorStreetName && contractorStreetNumber
    //     ? `${contractorStreetNumber} ${contractorStreetName}`
    //     : undefined;
    // data.contractor_city = await getInputValue(page, '#HICCity');
    // data.contractor_state = await getInputValue(page, '#HICState');
    // data.contractor_zip = await getInputValue(page, '#HICZip');
    // data.contractor_phone_number = await getInputValue(page, '#HICPhone');
    // data.contractor_email_address = await getInputValue(page, '#HICEmail');

    data.total_fees = await GetValue(page, '#EstimatedCost');
    data.expiration_date = await GetValue(page, '#HICLicExpDate');
    data.permittypedescr = await GetValue(page, '#LocationNatureofProposedWork');

    exported.push(data);
    // console.log(`saved: ${permitNumber}`);

    rows = await tableBody?.$$('tr');
    rowCount++;
  }

  const nextButton = await page.$('#PublicHome_next');
  const link = await nextButton?.$('a');
  const isDisabled = await nextButton?.evaluate((el) => el.classList.contains('disabled'));
  const hasMore = !isDisabled;

  if (hasMore) {
    await link?.click();
    // console.log('next page');
    await new Promise((resolve) => setTimeout(resolve, smallDelay));
  }

  return isDisabled!;
}

async function GetValue(page: puppeteer.Page, selector: string) {
  const els = await page.$(selector);
  if (!els) {
    return undefined;
  }
  return (
    (await page.$eval(selector, (el) => (el as unknown as { value: string }).value))?.trim() ||
    undefined
  );
}
