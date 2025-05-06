import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { config } from '@/utils/config';
import type { Board } from '@mondaydotcomorg/api';
import { backOff } from 'exponential-backoff';
import { createTransporter, email } from '../utils/email';
import type { ensureKeys } from '../utils/ensureKeys';
import { getBoard } from '../utils/group';
import { updateColumn } from './agent';

const BOARD_ID = '4701666749';
const DIR = join(__dirname);

const DATA = join(DIR, `${BOARD_ID} Data.json`);
const DATA_KEYS = join(DIR, `${BOARD_ID} Keys.json`);
const DATA_EMAILED = join(DIR, `${BOARD_ID} Emailed.json`);

const KEYS = [
  'Client',
  'Brokerage Location',
  'Auto Number',
  'Email',
  'Mobile Phone Number',
  'Team',
  'Button',
  'Date',
  'Emailed',
];

async function main(): Promise<void> {
  // const d = await getBoard(BOARD_ID);
  // writeFileSync(DATA, JSON.stringify(d, null, 2));
  // //

  createTransporter({
    config,
    a: config.allen,
    template_path: join(DIR, 'alan template.txt'),
  });
  const board = JSON.parse(readFileSync(DATA, 'utf-8')) as Board;
  const keys = JSON.parse(readFileSync(DATA_KEYS, 'utf-8')) as Awaited<
    ReturnType<typeof ensureKeys>
  >;
  const oldEmailedList = JSON.parse(readFileSync(DATA_EMAILED, 'utf-8')) as {
    [key: string]: Awaited<ReturnType<typeof email>>;
  };
  const newEmailedList: Record<string, Awaited<ReturnType<typeof email>>> = {};

  for (const group of board.groups || []) {
    if (
      !group ||
      group.title.toLowerCase() === 'email' ||
      group.title.toLowerCase() === 'non email'
    ) {
      continue;
    }

    const [cityName, ...rest] = group.title.split(' ');

    for (const item of group.items_page.items || []) {
      if (item.name in newEmailedList) {
        // console.log(`already emailed ${item.name}\n`);
        await updateColumn({
          boardId: BOARD_ID,
          item_id: item.id,
          column_id: keys.columnIds['Emailed'],
          value: 'Skipped - Already Emailed',
        });
        continue;
      }

      if (item.name in oldEmailedList) {
        // console.log(`already emailed ${item.name}\n`);
        continue;
      }

      await new Promise((r) => setTimeout(r, 1500));

      const emailColumn = item.column_values.find((c) => c.column.title.toLowerCase() === 'email');

      if (!emailColumn) {
        // console.log(group);
        // console.log(item);
        throw new Error('NO EMAIL COLUMN');
      }

      if (emailColumn.value === null || typeof emailColumn.value !== 'string') {
        // console.log(`no email for ${item.name}\n`);
        continue;
      }

      const data = JSON.parse(emailColumn.value) as Record<string, string>;
      const n = breakApartName(item.name);

      try {
        const i = await backOff(
          () =>
            email({
              // to: data.email,
              name: n.firstName,

              // TESTING

              // to: 'arielmb@bu.edu',
              // cc: ['jmasresha@gmail.com'],

              // PROD

              to: data.email,

              subject: 'Acquiring off Market Properties',
              city: cityName,
            }),
          {
            numOfAttempts: 10,
            startingDelay: 1000,
            timeMultiple: 3,
            retry: (e, attemptNumber) => {
              // console.log(`retrying sending email to ${data.email}: attempt ${attemptNumber}`);
              // console.log(e);
              // console.log();

              return true;
            },
          },
        );

        //         const i = await
        //         email({
        //   // to: data.email,
        //   name: n.firstName,

        //   // TESTING

        //   // to: 'arielmb@bu.edu',
        //   // cc: ['jmasresha@gmail.com'],

        //   // PROD

        //   to: data.email,
        //   cc: ['ilya@triobuilds.com'],

        //   subject: 'Acquiring off Market Properties',
        //   city: cityName,
        // });

        newEmailedList[item.name] = i;
        writeFileSync(
          DATA_EMAILED,
          JSON.stringify(
            {
              ...oldEmailedList,
              ...newEmailedList,
            },
            null,
            2,
          ),
        );
        await updateColumn({
          boardId: BOARD_ID,
          item_id: item.id,
          column_id: keys.columnIds['Emailed'],
          value: 'Yes',
        });

        // console.log(`emailed ${item.name}\n`);
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }

        throw e;
      }
    }
  }

  // const i = await email({
  //   to: 'arielmb@bu.edu',
  //   subject: 'Acquiring off Market Properties',
  //   city: '[testing]',
  // });
  // // console.log(i);
}

interface NameParts {
  firstName: string;
  lastName?: string;
  case: number;
}

export function breakApartName(name: string): NameParts {
  const nameParts = name.trim().split(/\s+/);

  // Handle specific cases where the entire name is the first name
  if (name.toLowerCase().includes('team') || name.toLowerCase().includes('group')) {
    return { firstName: name, case: 1 };
  }

  // Handle the case with "and" or "&" in the name
  const andIndex = nameParts.findIndex((part) => part.toLowerCase() === 'and' || part === '&');

  // if (andIndex !== -1 && andIndex + 1 < nameParts.length - 1) {
  if (andIndex !== -1) {
    return { firstName: name, case: 2 };
  }

  const plusIndex = nameParts.findIndex((part) => part.toLowerCase() === '+');

  if (plusIndex !== -1) {
    return { firstName: name, case: 3 };
  }

  // Handle cases with a number at the start
  if (/^\d/.test(nameParts[0])) {
    return { firstName: nameParts.slice(1).join(' '), lastName: undefined, case: 4 };
  }

  // Handle cases with an initial or prefix
  if (/^[A-Z]\.$/.test(nameParts[0])) {
    return {
      firstName: nameParts.slice(1, -1).join(' '),
      lastName: nameParts.slice(-1).join(' '),
      case: 5,
    };
  }

  // Handle cases where the first name is a single part and last name may include prefixes
  if (nameParts.length > 1) {
    const firstName = nameParts.slice(0, 1).join(' ');
    const lastName = nameParts.slice(1).join(' ');
    const namee = { firstName, lastName, case: 6 };

    return namee;
  }

  // Handle single name case
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], case: 7 };
  }

  return { firstName: '', lastName: undefined, case: 8 }; // Fallback for any unexpected cases
}

main();
