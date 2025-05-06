import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { prisma } from '@/utils/db';

import * as paths from '@/utils/paths';

const dir: string = join(paths.DATA, 'backup');

if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

async function save(model: any, file: string): Promise<void> {
  const data = await model.findMany();
  writeFileSync(join(dir, file), JSON.stringify(data, null, 2));
}

export async function main(): Promise<void> {
  // await save(prisma.westRoxbury, 'West Roxbury');
  // await save(prisma.brookline, 'Brookline');
  // await save(prisma.norwood, 'Norwood');
  // await save(prisma.milton, 'Milton');
  // console.log(await prisma.westRoxbury.findMany());
}

main();
