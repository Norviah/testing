import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import puppateer, { Page } from 'puppeteer';

import { SavedPermitDataStructure, SavedPermitDataStructureWithDate } from '@/types';
import { browserConfig } from '@/utils/config';
import { logger } from '@/utils/logger';
import * as paths from '@/utils/paths';

const downloadsPath = join(homedir(), 'Downloads');

export async function main(): Promise<void> {
  if (!existsSync(paths.MEDWAY)) {
    mkdirSync(paths.MEDWAY, { recursive: true });
  }

  const browser = await puppateer.launch({ ...browserConfig });
  const page = await browser.newPage();

  await page.goto(
    'https://www6.citizenserve.com/Portal/PortalController?Action=showSearchPage&ctzPagePrefix=Portal_&installationID=278&original_iid=0&original_contactID=0',
  );

  const filetypeSelect = await page.$('#filetype');
  await filetypeSelect?.select('Permit');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const today = new Date();

  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();

  const issuedTextInput = await page.$('input[id="to"]');
  await issuedTextInput?.type(`${month}/01/${year}`);

  const submitRow = await page.$('#submitRow');
  const submitButton = await submitRow?.$('button');
  await submitButton!.click();

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const data: SavedPermitDataStructure<'Medway', 'MA'>[] = [];

  let hasMore = false;
  let pageCounter = 1;

  do {
    const d = await parseTable(page, pageCounter);
    data.push(...d.data);
    hasMore = d.hasMore;

    if (hasMore) {
      const nextButton = await page.$('.icon-arrow-right');
      await nextButton?.click();
      pageCounter++;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } while (hasMore);

  await browser.close();

  writeFileSync(paths.MEDWAY_DATA, JSON.stringify(data, null, 2));

  // console.log(data);
}

async function parseTable(page: Page, pageCounter: number) {
  let rows = await getRows(page);
  let currentPage = pageCounter;

  // const data: Record<string, string | boolean | null>[] = [];
  const data: SavedPermitDataStructure<'Medway', 'MA'>[] = [];

  for (let i = 0; i < rows.length; i++) {
    // for (let i = 0; i < 2; i++) {
    const cells = await rows[i].$$('td');

    const permitNumber = await cells[0].evaluate((node) => node.textContent);
    const permitAddress = await cells[1].evaluate((node) => node.textContent);
    const permitType = await cells[2].evaluate((node) => node.textContent);
    const subType = await cells[3].evaluate((node) => node.textContent);
    const status = await cells[4].evaluate((node) => node.textContent);
    const issuedDate = await cells[5].evaluate((node) => node.textContent);
    const description = await cells[6].evaluate((node) => node.textContent);

    if (!permitType?.toLowerCase().includes('residential building permit')) {
      continue;
    }

    const link = await cells[0].$('a');

    await link?.click();

    // await page.waitForNavigation();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // const d = await parsePage(page);
    let d: Awaited<ReturnType<typeof parsePage>>;

    try {
      // console.log(1);
      d = await parsePage(page);
      // console.log(2);
    } catch {
      // console.log(3);
      await page.goBack();
      continue;
    }
    // console.log(4);

    // worktype                       String?
    // permittypedescr                String?
    // description                    String?
    // comments                       String?
    // declared_valuation             String?
    // total_fees                     String?
    // issued_date                    DateTime?
    // expiration_date                DateTime?
    // applied_date                   DateTime?
    // finalized_date                 DateTime?
    // status                         String?
    // occupancytype                  String?
    // sq_feet                        String?
    // address                        String?
    // zip                            String?
    // property_id                    String?
    // parcel_id                      String?
    // gpsy                           String?
    // gpsx                           String?
    // y_latitude                     String?
    // x_longitude                    String?
    // mbl                            String?
    // amount                         String?
    // applicant                      String?
    // applicant_mobile_number        String?
    // applicant_business             String?
    // applicant_address              String?
    // applicant_home_number          String?
    // applicant_work_number          String?
    // applicant_email_address        String?
    // licensed_professional_name     String?
    // licensed_professional_business String?
    // licensed_professional_address  String?
    // licensed_professional_not_sure String?
    // owner                          String?
    // estimated_cost_of_construction String?
    // owner_company                  String?
    // owner_phone_number             String?
    // zone                           String?
    // applicant_city                 String?
    // applicant_state                String?
    // applicant_zip                  String?
    // link                           String?
    // owner_email_address            String?
    // isDemo                         Boolean?

    data.push({
      ...d,
      isDemo: d.isDemo
        ? String(d.isDemo).toLowerCase().includes('yes')
        : description!.toLowerCase().includes('demo') ||
          d.permittypedescr?.toLowerCase().includes('demo') ||
          false,
      permitnumber: permitNumber!,
      address: permitAddress!,
      permittypedescr: permitType!,
      worktype: subType!,
      status: status!,
      issued_date: issuedDate!,
      description: description!,

      //       const permitNumber = await cells[0].evaluate((node) => node.textContent);
      // const permitAddress = await cells[1].evaluate((node) => node.textContent);
      // const permitType = await cells[2].evaluate((node) => node.textContent);
      // const subType = await cells[3].evaluate((node) => node.textContent);
      // const status = await cells[4].evaluate((node) => node.textContent);
      // const issuedDate = await cells[5].evaluate((node) => node.textContent);
      // const description = await cells[6].evaluate((node) => node.textContent);
    });

    await page.goBack();
    currentPage = 1;
    if (currentPage < pageCounter) {
      for (let i = 0; i < pageCounter - 1; i++) {
        const nextButton = await page.$('.icon-arrow-right');
        await nextButton!.click();

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      currentPage = pageCounter;
    }

    // logger.info(`parsed ${permitNumber} (${i + 1}/${rows.length})`);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    rows = await getRows(page);
  }

  const nextButton = await page.$('.icon-arrow-right');
  const hasMore = Boolean(nextButton);

  return {
    data,
    hasMore,
  };
}

async function getRows(page: Page) {
  const resultContent = await page.$('#resultContent');
  const table = await resultContent?.$('table');
  const tbody = await table?.$('tbody');
  const rows = await tbody!.$$('tr');

  return rows;
}

async function parsePage(page: Page): Promise<SavedPermitDataStructure<'Medway', 'MA'>> {
  // const record: Record<string, string | null> = {};

  // @ts-ignore
  const record: SavedPermitDataStructure<'Medway', 'MA'> = {
    city: 'Medway',
    state: 'MA',
  };

  const divs = await page.$$('div');

  if (!divs || divs.length === 0) {
    throw new Error('No divs found');
  }

  for (const [i, div] of divs.entries()) {
    const textContent = await div.evaluate((node) => node.textContent);

    for (const [key, value] of Object.entries(textsWithKey)) {
      if (textContent!.toLowerCase().includes(key)) {
        const text = (await divs[i + 1].evaluate((node) => node.textContent))?.replace(/\s+/g, ' ');

        // if (value in record && record[value]) {
        // } else {
        // @ts-ignore
        record[value] = text!.replace(key, '').trim() || undefined;
        // }
      }
    }
  }

  return record;
}

const textsWithKey: Record<string, keyof SavedPermitDataStructureWithDate<'Medway', 'MA'>> = {
  'issued date:': 'issued_date',
  'expiration date:': 'expiration_date',
  'permit type:': 'permittypedescr',

  'property owner phone number:': 'owner_phone_number',
  'property owner email address:': 'owner_email_address',
  'property owner name:': 'owner',

  'mailing address:': 'address',
  // 'mailing city:': 'city',
  // 'mailing state:': 'state',
  'mailing zip:': 'zip',

  //

  // address: 'address',
  // 'sub type': 'worktype',
  'issue date:': 'issued_date',
  'total project cost:': 'total_fees',

  //

  'total estimated job cost:': 'total_fees',
  'Estimated Value of Electrical Work': 'total_fees',

  'zoning district': 'zone',
  'Does this project include demolition work?': 'isDemo',
};
