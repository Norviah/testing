import puppateer from 'puppeteer';

export async function main(): Promise<void> {
  const browser = await puppateer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(
    'https://www6.citizenserve.com/Portal/PortalController?Action=showSearchPage&ctzPagePrefix=Portal_&installationID=390&original_iid=0&original_contactID=0',
  );

  // select from dropdowns
  await page.select('#filetype', 'Permit');
  await new Promise((resolve) => setTimeout(resolve, 300));
  await page.select('#PermitType', 'Building Permit, One or Two Family Dwelling');
  await new Promise((resolve) => setTimeout(resolve, 300));

  // find and click search button
  const submitRow = await page.$('#submitRow');
  const searchButton = await submitRow!.$('.btn.btn-default');
  await searchButton!.click();

  // wait until new page loads
  await page.waitForNavigation();
  const container = await page.$('#resultContent');
  const tableBody = await container!.$$('tbody');
  const tableRows = await tableBody[0].$$('tr');

  const data = {};

  // go through each row
  for (const row of tableRows) {
    const cells = await row.$$('td');
    const currentData = {};

    for (const [index, cell] of cells.entries()) {
      const text = await cell.evaluate((node) => node.textContent);
      // currentData[keys[index]] = text;
    }
  }
}
