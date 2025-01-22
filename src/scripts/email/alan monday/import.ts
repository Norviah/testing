import { getBoard } from './utils/group';

const BOARD_ID = '4701666749';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { config } from '@/utils/config';
import { meta } from '@/utils/helpers';
import * as paths from '@/utils/paths';

const keys = [
  'Client',
  'Brokerage Location',
  'Auto Number',
  'Email',
  'Mobile Phone Number',
  'Team',
  'Button',
  'Date',
];

const nameKey = 'Client';

async function main(): Promise<void> {
  const compassData = JSON.parse(
    readFileSync(join(paths.COMPANIES_COMPASS, 'MA', 'Weston', 'data.json'), 'utf-8'),
  ) as Record<string, string>[];

  const coldwellData = JSON.parse(
    readFileSync(join(paths.COMPANIES_COLDWELL, 'MA', 'Weston', 'data.json'), 'utf-8'),
  ) as Record<string, string>[];

  const agents = [...compassData, ...coldwellData];

  // let initialNumber = 1;

  const board = await getBoard(BOARD_ID);
  const info = await meta(keys, BOARD_ID);
  const group = board.groups.find((g) => g?.title.toLowerCase() === 'weston')!;

  // console.log(group);

  // ---
  // PUSHING DATA
  // ---

  for (const agent of agents) {
    //     const object = {
    //   'Brokerage Location': `${agent.company} Weston`,
    //   'Auto Number': `${initialNumber}`,
    //   Email: agent.email,
    //   'Mobile Phone Number': agent.phoneNumber || agent.mobile_phone,
    //   Team: undefined,
    //   Button: undefined,
    //   Date: undefined,
    // };

    let phoneNumber = (agent.phoneNumber || agent.mobile_phone)?.replace(/[- ()]/g, '');

    // if (phoneNumber) {
    //   const [one, two, three] = phoneNumber.replace(/[()]/g, '').replace(/[-]/g, ' ');

    //   phoneNumber = `(${one}) ${two}-${three}`;
    // }

    const object = {
      [info.columnIds['Brokerage Location']]: `${agent.company} Weston`,
      // [info.columnIds['Auto Number']]: initialNumber,
      [info.columnIds['Email']]: agent.email
        ? { email: agent.email, text: agent.email }
        : undefined,
      [info.columnIds['Mobile Phone Number']]: phoneNumber
        ? { phone: phoneNumber, countryShortName: 'US' }
        : undefined,
      [info.columnIds['Team']]: undefined,
      [info.columnIds['Button']]: undefined,
      [info.columnIds['Date']]: undefined,
    };

    const query = `mutation  {
      create_item(
        board_id: ${BOARD_ID}
        group_id: "${group.id}"
        item_name: "${agent.name.replace(/"/g, '')}"
        column_values: "${JSON.stringify(object).replace(/"/g, '\\"')}"
      ) {
        id
        column_values {
          id
          text
          value
        }
      }
    }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: query,
      }),
    }).then((res) => res.json());

    console.log(response);
    // initialNumber++;
  }
}

main();
