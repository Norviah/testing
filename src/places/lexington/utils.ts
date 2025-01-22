import type * as puppaeteer from 'puppeteer';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function combineAddress(address: string[]): string | undefined {
  const filtered = address.filter(isString);

  return filtered.length > 0 ? filtered.join(', ') : undefined;
}

export type AllSections = ApplicantSection &
  LocationSection &
  LicensedProfessionalSection &
  MoreDetailSection;

export type ApplicantSection = {
  applicant?: string;
  applicant_business?: string;
  applicant_address?: string;
  applicant_home_number?: string;
  applicant_work_number?: string;
  applicant_mobile_number?: string;
  applicant_email_address?: string;
};

export async function importApplicantSection(
  section: puppaeteer.ElementHandle<HTMLTableSectionElement> | null,
): Promise<ApplicantSection> {
  const applicantFullNameContainer = await section?.$('.contactinfo_fullname');
  const applicantFullName = await applicantFullNameContainer?.evaluate((el) =>
    el.textContent?.trim(),
  );

  const applicantBusinessContainer = await section?.$('.contactinfo_businessname');
  const applicantBusinessName = await applicantBusinessContainer?.evaluate((el) =>
    el.textContent?.trim(),
  );

  const applicantAddressContainer = await section?.$('.contactinfo_addressline1');
  const applicantStreetAddress = await applicantAddressContainer?.evaluate((el) =>
    el.textContent?.trim(),
  );

  const applicantRegionsContainers = (await section?.$$('.contactinfo_region')) || [];
  const applicantRegions: string[] = [];
  for (const r of applicantRegionsContainers) {
    const text = await r.evaluate((el) => el.textContent?.trim().replace(',', ''));
    if (text) {
      applicantRegions.push(text);
    }
  }

  const applicantHomePhoneNumberContainer = await section?.$('.contactinfo_phone1');
  const applicantHomePhoneNumber = await applicantHomePhoneNumberContainer?.evaluate((el) =>
    el.textContent?.trim().replace(/.*:/, ''),
  );

  const applicantWorkPhoneContainer = await section?.$('.contactinfo_phone3');
  const applicantWorkPhoneNumber = await applicantWorkPhoneContainer?.evaluate((el) =>
    el.textContent?.trim().replace(/.*:/, ''),
  );

  const applicantMobilePhoneContainer = await section?.$('.contactinfo_phone2');
  const applicantMobilePhoneNumber = await applicantMobilePhoneContainer?.evaluate((el) =>
    el.textContent?.trim().replace(/.*:/, ''),
  );

  const applicantEmailContainer = await section?.$('.contactinfo_email');
  const applicantEmailAddress = await applicantEmailContainer?.evaluate((el) =>
    el.textContent?.trim(),
  );

  const applicantAddress = [applicantStreetAddress, ...applicantRegions].filter(
    (x): x is string => typeof x === 'string',
  );

  return {
    applicant: applicantFullName,
    applicant_business: applicantBusinessName,
    // applicantStreetAddress,
    // applicantAddress: applicantRegions.join(', ').trim(),
    // applicantAddress: applicantAddress.length > 0 ? applicantAddress.join(', ') : undefined,
    applicant_address: combineAddress(applicantAddress),
    applicant_home_number: applicantHomePhoneNumber,
    applicant_work_number: applicantWorkPhoneNumber,
    applicant_mobile_number: applicantMobilePhoneNumber,
    applicant_email_address: applicantEmailAddress,
  };
}

export type LocationSection = {
  owner?: string;
  address?: string;
  city?: string;
  zip?: string;
  state: 'KY';
};

export async function importOwnerSection(
  body: puppaeteer.ElementHandle<HTMLTableSectionElement> | null,
): Promise<LocationSection> {
  const rows = (await body?.$$('tr')) || [];
  const ownersData = [] as (string | undefined)[];
  for (const row of rows) {
    ownersData.push(await row.evaluate((el) => el.textContent?.trim()));
  }

  return {
    owner: ownersData[0],
    address: ownersData[1],
    city: 'Lexington',
    zip: ownersData[2]?.split(' ').at(-1),
    state: 'KY',
  };
}

export type MoreDetailSection = {
  total_fees?: string;
  expiration_date?: string;
  worktype?: string;
  permittypedescr?: string;
  isDemo?: boolean;
};

export async function importMoreDetailSection(
  blocks: puppaeteer.ElementHandle<HTMLDivElement>[],
): Promise<MoreDetailSection> {
  const moreDetailObject = {} as MoreDetailSection;

  for (const [index, block] of blocks.entries()) {
    const rawText = await block.evaluate((el) => el.textContent?.trim());
    const text = rawText?.toLowerCase();

    if (text?.includes('type of improvement')) {
      const improvementTypeContainer = blocks[index + 1];
      const improvementType = await improvementTypeContainer.evaluate((el) =>
        el.textContent?.trim(),
      );

      if (improvementType?.toLowerCase().includes('demolition')) {
        moreDetailObject.isDemo = true;
      }
    } else if (text?.includes('total job cost')) {
      const amountContainer = blocks[index + 1];
      const amount = await amountContainer.evaluate((el) => el.textContent?.trim());
      moreDetailObject.total_fees = amount!;
    } else if (text?.includes('workers comp exp date')) {
      const dateContainer = blocks[index + 1];
      const date = await dateContainer.evaluate((el) => el.textContent?.trim());
      moreDetailObject.expiration_date = date!;
    } else if (text?.includes('construction type')) {
      const workTypeContainer = blocks[index + 1];
      const workType = await workTypeContainer.evaluate((el) => el.textContent?.trim());
      moreDetailObject.worktype = workType!;
    } else if (text?.includes('use classification')) {
      const permitTypeContainer = blocks[index + 1];
      const permitType = await permitTypeContainer.evaluate((el) => el.textContent?.trim());
      moreDetailObject.permittypedescr = permitType!;
    }
  }

  return moreDetailObject;
}

export type LicensedProfessionalSection = {
  licensed_professional_name?: string;
  licensed_professional_business?: string;
  licensed_professional_address?: string;
  licensed_professional_not_sure?: string;
};

export async function importLicensedProfessionalSection(
  section: puppaeteer.ElementHandle<Element>,
): Promise<LicensedProfessionalSection> {
  const text = await section?.evaluate((el) => el.textContent?.trim());
  const [
    licensedProfessionalName,
    licensedProfessionalBusinessName,
    licensedProfessionalStreetAddress,
    licensedProfessionalAddress,
    ...licensedProfessionalX
  ] = text?.split(/\s{2,}/) ?? [];

  return {
    licensed_professional_name: licensedProfessionalName.includes(':')
      ? licensedProfessionalName.split(':')[1].trim()
      : licensedProfessionalName,
    licensed_professional_business: licensedProfessionalBusinessName,
    // licensedProfessionalStreetAddress,
    // licensedProfessionalAddress,
    licensed_professional_address: combineAddress([
      licensedProfessionalStreetAddress,
      licensedProfessionalAddress,
    ]),
    licensed_professional_not_sure: licensedProfessionalX.join(' '),
  };
}
