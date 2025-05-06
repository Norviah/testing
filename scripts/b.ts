import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'random-useragent';

import type * as Puppeteer from 'puppeteer';

type Agent = {
  name: string;
  company: string | undefined;
  activityRange: string | undefined;
  stars: number | undefined;
  realtorLink: string | undefined;
  experience: string | undefined;
  phoneNumber: string | undefined;
};

const agentData: Agent[] = [];

async function main(): Promise<void> {
  puppeteer.use(StealthPlugin());
  puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

  const browser = await puppeteer.launch({ headless: false });
  let page = await browser.newPage();
  // const userAgent = UserAgent.getRandom();
  // await page.setUserAgent(userAgent);

  const baseUrl = 'https://www.realtor.com/realestateagents/new-bedford_ma';
  let pageNumber = 1;

  let finished = false;
  do {
    const userAgent = UserAgent.getRandom();
    await page.setUserAgent(userAgent);
    await page.goto(pageNumber === 1 ? baseUrl : `${baseUrl}/pg-${pageNumber}`, { timeout: 0 });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // if (pageNumber > 0) {
    //   await page.goto(`${baseUrl}/pg-${pageNumber}`, { timeout: 0 });
    // } else {
    // }

    // await readTable(page);
    await page.close();
    page = await browser.newPage();
    pageNumber++;
  } while (!finished);
}

async function readTable(page: Puppeteer.Page): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const agentListCotnainer = await page.$('#agent_list_main_column');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const agentListWrapper = await agentListCotnainer!.$('#agent_list_wrapper');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const agentListCardWrapper = await agentListWrapper!.$('.cardWrapper');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const agentList = await agentListCardWrapper!.$('ul');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const agents = await agentList?.$$('.agent-list-card');

  for (const agent of agents ?? []) {
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    const cardDetails = await agent.$('.card-details');
    const [aboutSection, informationSection] = (await cardDetails?.$$(
      '.jsx-3873707352.col-lg-6.col-md-6.col-sm-12.mob-padding',
    ))!;

    const aboutSectionSpans = await aboutSection?.$$('span');
    // let phoneNumber: string | undefined = undefined;

    // for (const span of aboutSectionSpans ?? []) {
    //   const text = await span.evaluate((el) => el.textContent);
    //   const phoneNumberMatch = text?.match(/\(\d{3}\) \d{3}-\d{4}/);

    //   if (phoneNumberMatch) {
    //     phoneNumber = phoneNumberMatch[0];
    //   }
    // }

    // let range: string | undefined = undefined;

    // const informationSectionSpans = await informationSection?.$$('span');
    // for (const span of informationSectionSpans ?? []) {
    //   const text = await span.evaluate((el) => el.textContent);
    //   // console.log(text);

    //   // check if text equals this pattern: $(any number)(any letter) - $(any number)(any letter)
    //   const rangeMatch = text?.match(/\$([0-9]+)[a-zA-Z] - \$([0-9]+)[a-zA-Z]/);
    //   if (rangeMatch) {
    //     range = rangeMatch[0];
    //   }
    // }

    const nameLink = await aboutSection?.$('a');
    const realtorLink = await nameLink?.getProperty('href');
    const realtorLinkValue = await realtorLink?.jsonValue();
    const nameContainer = await nameLink?.$('span');
    const name = await nameContainer?.evaluate((el) => el.textContent);

    // console.log(name);
    // console.log('-');

    // const agentGroupContainer = await aboutSection?.$('.agent-group');
    // const agentGroup = await agentGroupContainer?.$('div');
    // const group = await agentGroup?.evaluate((el) => el.textContent);

    // const experienceText =
    //   (await aboutSectionSpans[1]?.evaluate((el) => el.textContent))?.trim() || undefined;

    // const reviewCountContainer = await aboutSection?.$('.card-review-count');
    // const svgs = (await reviewCountContainer?.$$('svg')) ?? [];

    // let stars: number | undefined = 0;
    // for (let i = 0; i < svgs.length; i++) {
    //   const svg = svgs[i];
    //   const svgClass = await svg.evaluate((el) => el.getAttribute('data-testid'));

    //   if (svgClass === 'icon-star-filled') {
    //     stars++;
    //   } else if (svgClass === 'icon-star-half-color-filled') {
    //     stars += 0.5;
    //     break;
    //   } else {
    //     break;
    //   }
    // }

    // stars = svgs.length === 0 ? undefined : stars;

    // const data: Agent = {
    //   name: name!,
    //   company: group!,
    //   activityRange: range,
    //   stars: stars!,
    //   realtorLink: realtorLinkValue!,
    //   experience: experienceText!,
    //   phoneNumber,
    // };
    // agentData.push(data);
  }
  // const nextButton = await page.$('#PublicHome_next');
  // const link = await nextButton?.$('a');
  // const isDisabled = await nextButton?.evaluate((el) => el.classList.contains('disabled'));
  // const hasMore = !isDisabled;

  // const paginationWrapper = await page!.$('.paginatorWrapper');
  // const paginationContainer = await paginationWrapper!.$('div');
  // const nextButton = await paginationContainer!.$('.next-link');

  // const isDisabled = await nextButton?.evaluate((el) => el.classList.contains('disabled'));
  // const hasMore = !isDisabled;

  // if (hasMore) {
  //   await nextButton?.click();
  //   // console.log('next page');
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  // }

  // return hasMore;

  return false;
}

main();
