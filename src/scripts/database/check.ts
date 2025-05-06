import { readFileSync, write, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@/utils/db';

import type { Agent, City } from '@prisma/client';

type BackupAgent = {
  id: string;
  dateAdded: string;
  name: string;
  company?: string;
  realtorLink?: string;
  coldwellLink?: string;
  phoneNumber?: string;
  city: string;
  state: string;
  stars?: string;
  experience?: string;
  activityRange?: string;
  jobTitle?: string;
  officePhoneNumber?: string;
  directPhoneNumber?: string;
  email?: string;
  office?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  linkedIn?: string;
  svnLink?: string;
};

async function main(): Promise<void> {
  // const backup = JSON.parse(
  //   readFileSync(join(__filename, '..', 'backup.json'), 'utf-8'),
  // ) as BackupAgent[];
  // 115701

  const data = await prisma.agent.findMany({
    include: {
      cities: true,
    },
  });

  let i = 0;

  for (const agent of data) {
    for (const city of agent.cities) {
      i++;
    }
  }

  // console.log(i);
  // console.log(data.length);
}

main();
