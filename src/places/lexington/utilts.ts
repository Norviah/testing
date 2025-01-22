import type { SavedPermitDataStructure } from '@/types';
import type { ElementHandle, Page } from 'puppeteer';

const longDelay = 20000;
const shortDelay = 10000;

export async function getPermitNumber(page: Page, number: string) {
  await page.goto('https://lexingtonma.portal.opengov.com/search');

  await new Promise((resolve) => setTimeout(resolve, longDelay));

  const recordTab = await page.waitForSelector('#record-tab');
  await recordTab!.click();

  const input = await page.$('#recordSearchKey');
  await input!.type(number);

  await new Promise((resolve) => setTimeout(resolve, shortDelay));

  // const list = await page.$('.list-group');
  // const link = await list!.$('a');
  const link = await page.$('.list-group-item');
  const href = await (await link!.getProperty('href')).jsonValue();

  await page.goto(href as string);

  return await parsePage(page, number);
}

type Reference = {
  name: string;
  dict: Record<string, keyof SavedPermitDataStructure<string, string>>;
  array: (keyof SavedPermitDataStructure<string, string>)[];
};

const references: Reference[] = [
  {
    name: 'Construction Supervisor License',
    dict: {
      Name: 'applicant',
      Email: 'applicant_email_address',
      'Phone Number': 'applicant_home_number',
      'Phone Numer': 'applicant_home_number',
    },
    array: [],
  },
  {
    name: 'Permit Info',
    dict: {
      'Project Cost': 'total_fees',
      'Work Description': 'description',
    },
    array: [],
  },
  {
    name: 'Owners Information',
    dict: {
      'Owners Name': 'owner',
      'Owners Phone Number': 'owner_phone_number',
      'Owners Email Address': 'owner_email_address',
    },
    array: [],
  },
  {
    name: "Owner's Information",
    dict: {},
    array: ['owner', 'address', 'owner_phone_number'],
  },
];

async function parsePage(
  page: Page,
  number: string,
): Promise<Partial<Record<keyof SavedPermitDataStructure<string, string>, string | null>>> {
  await new Promise((resolve) => setTimeout(resolve, shortDelay));

  const detailsCol = await page.$('#details-col');
  const details = await detailsCol!.$('#details');
  const divs = await details!.$$('.row');

  const record: Partial<Record<keyof SavedPermitDataStructure<string, string>, string | null>> = {};

  for (const div of divs) {
    const headerSection = await div.$('h4');
    const header = await headerSection?.evaluate((el) => el.textContent);

    const reference = references.find(
      (ref) => ref.name.toLowerCase() === header?.trim().toLowerCase(),
    );

    const hasTable = await div.$('table');

    if (reference) {
      if (hasTable) {
        await getSectionTable(div, reference, record);
      } else {
        await getSection(div, reference, record);
      }
    }
  }

  return record;
}

async function getSection(
  div: ElementHandle<Element>,
  reference: Reference,
  record: Partial<Record<keyof SavedPermitDataStructure<string, string>, string | null>>,
): Promise<void> {
  const container = await div.$('div.row');
  const divs = await container!.$$('div');

  const referenceMap = new Map(
    Object.entries(reference.dict).map((entry) => {
      return [entry[0].toLowerCase(), entry[1]];
    }),
  );

  for (const div of divs) {
    const label = await div.$('label');
    const labelText = await label?.evaluate((el) => el.textContent);

    const content = await div.$('p');
    const contentText = await content?.evaluate((el) => el.textContent);

    const labelPared = labelText?.replace(/\n|\t|\*/g, '').trim();
    const contentPare = contentText?.replace(/\n|\t|\*/g, '').trim();

    const reference = referenceMap.get(labelPared?.toLowerCase() ?? 'NOTHING');

    if (reference) {
      record[reference] = contentPare ?? null;
    }
  }
}

async function getSectionTable(
  div: ElementHandle<Element>,
  reference: Reference,
  record: Partial<Record<keyof SavedPermitDataStructure<string, string>, string | null>>,
): Promise<void> {
  const container = await div.$('div.row');
  const tableBody = await container!.$('tbody');
  const tableRows = await tableBody!.$$('td');

  for (let i = 0; i < reference.array.length; i++) {
    const key = reference.array[i];
    const value =
      (await tableRows[i].evaluate((el) => el.textContent))?.replace(/\n|\t|\*/g, '').trim() ??
      null;

    record[key] = value!.replace(/\n|\t|\*/g, '').trim() ?? null;
  }
}
