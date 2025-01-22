import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { config } from '@/utils/config';
import { meta } from '@/utils/helpers';
import type { Agent, City, MondayEntry } from '@prisma/client';
import { backOff } from 'exponential-backoff';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { updateAgent } from '../utils/agent';
import { createTransporter, email } from '../utils/email';
import { ensureKeys } from '../utils/ensureKeys';
import { getBoard } from '../utils/group';

const DIR = join(__filename, '..');
const template = readFileSync(join(DIR, 'adam template.txt'), 'utf8');
const names = JSON.parse(readFileSync(join(DIR, 'names.json'), 'utf8')) as Record<
  string,
  SMTPTransport.SentMessageInfo | 'N/A - Alan already emailed'
>;
const alanEmailed = JSON.parse(
  readFileSync(join(DIR, '../alan monday/4701666749 Emailed.json'), 'utf8'),
) as Record<string, SMTPTransport.SentMessageInfo>;

const backup = JSON.parse(readFileSync(join(DIR, 'backup.json'), 'utf8')) as (Agent & {
  cities: City[];
  monday: MondayEntry[];
})[];

const CITIES_TO_EMAIL = ['Nashua', 'Manchester', 'Providence', 'Pawtucket', 'Hartford'].map((x) =>
  x.toLowerCase(),
);

const keys = [
  // 'createdAt',
  // 'updatedAt',
  'name',
  'company',
  'phoneNumber',
  // 'cities',
  'stars',
  'experience',
  'activityRange',
  'jobTitle',
  'officePhoneNumber',
  'directPhoneNumber',
  'email',
  'office',
  'website',
  // 'contacts',
  'facebook',
  'instagram',
  'tiktok',
  'twitter',
  'linkedIn',
  'realtor',
  'coldwell',
  'svn',
  'id',
  // 'board',
  'emailed',
  'hammond',
  'compass',
];

const boards = JSON.parse(readFileSync(join(DIR, 'boards.json'), 'utf8')) as Record<
  string,
  Awaited<ReturnType<typeof meta>>
>;

async function main() {
  createTransporter({
    config,
    a: config.adam,
    template_path: join(DIR, 'adam template.txt'),
  });

  for (const agent of backup) {
    if (!agent.email) {
      // console.log(`skipping ${agent.name} because they have no email\n`);
      continue;
    }

    if (agent.name in names) {
      // console.log(`skipping ${agent.name} because they have already been emailed`);
      continue;
    }

    if (agent.name in alanEmailed) {
      // console.log(`skipping ${agent.name} because Alan already emailed them`);
      for (const entry of agent.monday) {
        const board = boards[entry.boardId];

        if (!board) {
          console.log('board for this entry not found');
          console.log(entry);
          console.log(agent);

          throw new Error('STOP');
        }

        await updateAgent(agent, entry, board, 'emailed', 'Skipped - Alan already emailed');
        names[agent.name] = 'N/A - Alan already emailed';
        writeFileSync(join(DIR, 'names.json'), JSON.stringify(names, null, 2));
      }

      console.log(`skipped ${agent.name} because Alan already emailed them\n`);
      continue;
    }

    const wantedCities = [] as City[];
    const unwantedCities = [] as City[];

    for (const city of agent.cities) {
      if (CITIES_TO_EMAIL.includes(city.name.toLowerCase())) {
        wantedCities.push(city);
      } else {
        unwantedCities.push(city);
      }
    }

    if (wantedCities.length === 0) {
      // console.log(`skipping ${agent.name} because they have no cities to email\n`);
      continue;
    }

    const n = breakApartName(agent.name);

    try {
      for (const city of wantedCities) {
        await UpdateEmailColumn(agent, city, 'Yes');
      }
      console.log(`updated wanted cities for ${agent.name}`);

      for (const city of unwantedCities) {
        await UpdateEmailColumn(agent, city, 'Skip - Already sent email to other city');
      }
      console.log(`updated unwanted cities for ${agent.name}`);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const i = await backOff(
        async () => {
          return await email({
            name: n.firstName,

            to: agent.email!,
            subject: 'Acquiring off Market Properties',

            city: combine(wantedCities.map((x) => x.name)),
          });
        },
        {
          numOfAttempts: 10,
          startingDelay: 1000,
          timeMultiple: 3,
          retry: (e, attemptNumber) => {
            console.log(`retrying sending email to ${agent.email}: attempt ${attemptNumber}`);
            console.log(e);
            console.log();

            return true;
          },
        },
      );

      names[agent.name] = i;
      writeFileSync(join(DIR, 'names.json'), JSON.stringify(names, null, 2));

      console.log(`emailed ${agent.name}\n`);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw e;
    }
  }
}

async function UpdateEmailColumn(
  agent: Agent & {
    cities: City[];
    monday: MondayEntry[];
  },
  city: City,
  value: string,
) {
  const mondayEntry = agent.monday.find((m) => {
    // return m.boardId === city.boardId && m.groupId === city.groupId;

    const actualResult = m.boardId === city.boardId && m.groupId === city.groupId;

    if (actualResult) {
      return true;
    }

    return (
      m.boardId === city.boardId && m.groupId.includes(city.name.replace(/ /g, '_').toLowerCase())
    );
  });

  if (!mondayEntry) {
    console.log('monday entry not found');
    console.log(agent);
    console.log(city);

    throw new Error('STOP');
  }

  const board = boards[mondayEntry.boardId];

  if (!board) {
    console.log('board for this entry not found');
    console.log(mondayEntry);
    console.log(agent);

    throw new Error('STOP');
  }

  await updateAgent(agent, mondayEntry, board, 'emailed', value);
}

function combine(array: string[]): string {
  const lastElement = array.pop();

  return lastElement && array.length > 0
    ? `${array.join(', ')} and ${lastElement}`
    : lastElement || '';
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

  return { firstName: name, lastName: undefined, case: 8 }; // Fallback for any unexpected cases
}

main();
