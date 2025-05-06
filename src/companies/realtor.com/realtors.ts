// import puppeteer from 'puppeteer-extra';
// import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// import UserAgent from 'random-useragent';

// import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// import * as paths from '@/utils/paths';
// import type * as Puppeteer from 'puppeteer';

// if (!existsSync(paths.REALTORS_BEDFORD_MA_DATA)) {
//   mkdirSync(paths.REALTORS_BEDFORD_MA, { recursive: true });
//   writeFileSync(paths.REALTORS_BEDFORD_MA_DATA, '[]');
// }

// type Agent = {
//   name: string;
//   company: string | undefined;
//   activityRange: string | undefined;
//   stars: number | undefined;
//   realtorLink: string | undefined;
//   experience: string | undefined;
//   phoneNumber: string | undefined;
// };

// const textData = readFileSync(paths.REALTORS_BEDFORD_MA_DATA, 'utf-8');
// let agentData: Agent[] = [];
// if (textData) {
//   agentData = JSON.parse(textData);
// }
// const argv = process.argv.slice(2);

// const baseUrl = argv[0];

// if (!baseUrl) {
//   console.error('Please provide a base url');
//   process.exit(1);
// }

// async function main(): Promise<void> {
//   puppeteer.use(StealthPlugin());
//   puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   const userAgent = UserAgent.getRandom();
//   await page.setUserAgent(userAgent);
//   await page.goto(baseUrl, { timeout: 0 });

//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   await readTable(page);
//   await browser.close();

//   // console.log('done');
//   writeFileSync(paths.REALTORS_BEDFORD_MA_DATA, JSON.stringify(agentData, null, 2));
// }

// async function readTable(page: Puppeteer.Page): Promise<void> {
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   const agentListCotnainer = await page.$('#agent_list_main_column');
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   const agentListWrapper = await agentListCotnainer!.$('#agent_list_wrapper');
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   const agentListCardWrapper = await agentListWrapper!.$('.cardWrapper');
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   const agentList = await agentListCardWrapper!.$('ul');
//   await new Promise((resolve) => setTimeout(resolve, 1000));

//   const agents = await agentList?.$$('.agent-list-card');

//   for (const agent of agents ?? []) {
//     // await new Promise((resolve) => setTimeout(resolve, 1000));
//     const cardDetails = await agent.$('.card-details');
//     const [aboutSection, informationSection] = (await cardDetails?.$$(
//       '.jsx-3873707352.col-lg-6.col-md-6.col-sm-12.mob-padding',
//     ))!;

//     const aboutSectionSpans = await aboutSection?.$$('span');
//     let phoneNumber: string | undefined = undefined;

//     for (const span of aboutSectionSpans ?? []) {
//       const text = await span.evaluate((el) => el.textContent);
//       const phoneNumberMatch = text?.match(/\(\d{3}\) \d{3}-\d{4}/);

//       if (phoneNumberMatch) {
//         phoneNumber = phoneNumberMatch[0];
//       }
//     }

//     let range: string | undefined = undefined;

//     const informationSectionSpans = await informationSection?.$$('span');
//     for (const span of informationSectionSpans ?? []) {
//       const text = await span.evaluate((el) => el.textContent);

//       // check if text equals this pattern: $(any number)(any letter) - $(any number)(any letter)
//       const rangeMatch = text?.match(/\$([0-9]+)[a-zA-Z] - \$([0-9]+)[a-zA-Z]/);
//       if (rangeMatch) {
//         range = rangeMatch[0];
//       }
//     }

//     const nameLink = await aboutSection?.$('a');
//     const realtorLink = await nameLink?.getProperty('href');
//     const realtorLinkValue = await realtorLink?.jsonValue();
//     const nameContainer = await nameLink?.$('span');
//     const name = await nameContainer?.evaluate((el) => el.textContent);

//     const agentGroupContainer = await aboutSection?.$('.agent-group');
//     const agentGroup = await agentGroupContainer?.$('div');
//     const group = await agentGroup?.evaluate((el) => el.textContent);

//     const experienceText =
//       (await aboutSectionSpans[1]?.evaluate((el) => el.textContent))?.trim() || undefined;

//     const reviewCountContainer = await aboutSection?.$('.card-review-count');
//     const svgs = (await reviewCountContainer?.$$('svg')) ?? [];

//     let stars: number | undefined = 0;
//     for (let i = 0; i < svgs.length; i++) {
//       const svg = svgs[i];
//       const svgClass = await svg.evaluate((el) => el.getAttribute('data-testid'));

//       if (svgClass === 'icon-star-filled') {
//         stars++;
//       } else if (svgClass === 'icon-star-half-color-filled') {
//         stars += 0.5;
//         break;
//       } else {
//         break;
//       }
//     }

//     stars = svgs.length === 0 ? undefined : stars;

//     const data: Agent = {
//       name: name!,
//       company: group!,
//       activityRange: range,
//       stars: stars!,
//       realtorLink: realtorLinkValue!,
//       experience: experienceText!,
//       phoneNumber,
//     };

//     // console.log(`saved: ${name}`);
//     agentData.push(data);
//   }
// }

// main();

import { Realtor } from './Realtor';

const places = [
  {
    state: 'Massachusetts',
    stateAbbreviation: 'MA',
    cities: [
      // 'New Bedford',
      // 'Fall River',
      // 'Taunton',
      // 'Worcester',
      // 'Salem',
      // 'Haverhill',
      // 'Stoneham',
      // 'Sharon',
      // 'Springfield',
      // 'Somerville',
      // 'Fichburg',
      // 'Leominster',

      // 'Gardner',
      // 'East Hampton',
      'Framingham',
      // 'Norwood',
      // 'Dedham',
      // 'Newton',
      // 'Needham',
      // 'Wellsley',
      // 'Westwood',
      // 'Canton',
      // 'Natick',
      // 'West Roxbury',
      // 'Medford',
      // 'Lawrence',
      // 'Brockton',
      // 'Revere',
      // 'Lynn',
      // 'Malden',
      // 'Weymouth',
      // 'Abington',
      // 'Whiteman',
      // 'Hanson',
      // 'Halifax',
      // 'Kingston',
      // 'Plymouth',
      // 'Randolph',
      // 'Brockton',
      // 'Bridgewater',
      // 'Lakewill',
      // 'Stoughton',
      // 'Mansfield',
      // 'Attleboro',
      // 'Foxborough',
      // 'Norfolk',
      // 'Franklin',
      // 'Needham',
      // 'Ashland',
      // 'Southborough',
      // 'Westborough',
      // 'Gafton',
      // 'Belmont',
      // 'Lincoln',
      // 'Concord',
      // 'Acton',
      // 'Littleton',
      // 'Ayer',
      // 'Shirley',
      'Winchester',
      'Woburn',
      'Wilmington',
      'North Billerica',
      'Wakefield',
      'Melrose',
      'Reading',
      'Andover',
      'Swampcott',
      // 'Beverly',
      'Hamilton',
      'Ipswich',
      'Rowley',
      'Newburyport',
      'Beverly',
      'Gloucester',
      'Rockport',
      'Middleborough',
      'East Taunton',
      'Freetown',
      'North Easton',
      'Raynham',
      'Chelmsford',
    ],
  },

  {
    state: 'Connecticut',
    stateAbbreviation: 'CT',
    cities: [
      'Hartford',
      'Bristol',
      'Fairfield',
      'New Haven',
      'Bridgeport',
      'Milford',
      'West Haven',
      'Newington',
      'Manchester',
      'Windsor',
      'Torrington',
      'Plainville',
      'New Britain',
      'Waterbury',
      'Naugatuck',
    ],
  },

  {
    state: 'Maine',
    stateAbbreviation: 'ME',
    cities: ['York'],
  },

  {
    state: 'New Hampshire',
    stateAbbreviation: 'NH',
    cities: [
      'Salem',
      'Londonderry',
      'Manchester',
      'Rochester',
      'Laconia',
      'Concord',
      'Bedford',
      'Dover',
      'Nashua',
      'Walpole',
      'Lincoln',
      'Newington',
      'Chester',
      'New Boston',
      'Fremont',
      'Barrington',
      'Windsor',
      'Hudson',
      'Pelham',
      'Portsmouth',
      'Exeter',
    ],
  },

  {
    state: 'Rhode Island',
    stateAbbreviation: 'RI',
    cities: [
      'Pawtucket',
      'Providence',
      'Warwick',
      'North Kingstown',
      'Foster Center',
      'Kingston',
      'Harrisville',
      'Misquamicut',
      'Cumberland Hill',
      'Wakefield-Peacedale',
      'Valley Falls',
      'Hope Valley',
      'Providence',
      'Quonochontaug',
      'Central Falls',
      'Narragansett Pier',
      'Chepachet',
      'Cranston',
      'Westerly',
      'North Providence',
      'Tiverton',
      'Bristol',
      'Greenville',
      'West Warwick',
      'Barrington',
      'East Providence',
      'Warwick',
      'Newport East',
      'Wyoming',
      'Greene',
      'Pascoag',
      'Ashaway',
      'Weekapaug',
      'Bradford',
      'Melville',
      'Carolina',
      'Watch Hill',
      'Harmony',
      'Clayville',
      'Woonsocket',
    ],
  },
] as const;

async function main(): Promise<void> {
  for (const place of places) {
    for (const city of place.cities) {
      // console.log(`starting: ${city}, ${place.stateAbbreviation}`);
      const realtor = new Realtor({
        state: place.state,
        stateAbbreviation: place.stateAbbreviation,
        city,
      });

      await realtor.scrape();
    }
  }

  // console.log('done');
}

main();
