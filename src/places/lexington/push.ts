import { readFileSync } from 'node:fs';
import { push } from '../push';

import * as paths from '@/utils/paths';

import type { SavedPermitDataStructure } from '@/types';

export async function main() {
  const rawData = JSON.parse(
    readFileSync(paths.LEXINGTON_DATA, 'utf-8').trim(),
  ) as SavedPermitDataStructure<'Lexington', 'MA'>[];

  await push(rawData);
}
