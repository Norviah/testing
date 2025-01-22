import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Board } from '@mondaydotcomorg/api';
import type { email } from '../utils/email';
import type { ensureKeys } from '../utils/ensureKeys';

const BOARD_ID = '4701666749';
const DIR = join(__dirname);

const DATA = join(DIR, `${BOARD_ID} Data.json`);
const DATA_KEYS = join(DIR, `${BOARD_ID} Keys.json`);
const DATA_EMAILED = join(DIR, `${BOARD_ID} Emailed.json`);

const board = JSON.parse(readFileSync(DATA, 'utf-8')) as Board;
const keys = JSON.parse(readFileSync(DATA_KEYS, 'utf-8')) as Awaited<ReturnType<typeof ensureKeys>>;
const emailed = JSON.parse(readFileSync(DATA_EMAILED, 'utf-8')) as {
  [key: string]: Awaited<ReturnType<typeof email>>;
};

const names = [];
for (const group of board.groups || []) {
  for (const group of board.groups || []) {
    if (
      !group ||
      group.title.toLowerCase() === 'email' ||
      group.title.toLowerCase() === 'non email'
    ) {
      continue;
    }

    for (const item of group.items_page.items || []) {
      const c = breakApartName(item.name);

      names.push({
        og: item.name,
        ...c,
      });
    }
  }
}

writeFileSync(join(DIR, 'names.json'), JSON.stringify(names, null, 2));

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
