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

const keys = [
  'id',
  'dateAdded',
  'name',
  'company',
  'realtorLink',
  'coldwellLink',
  'phoneNumber',
  'city',
  'state',
  'stars',
  'experience',
  'activityRange',
  'jobTitle',
  'officePhoneNumber',
  'directPhoneNumber',
  'email',
  'office',
  'website',
  'facebook',
  'instagram',
  'tiktok',
  'twitter',
  'linkedIn',
  'svnLink',
] as (keyof BackupAgent & string)[];

async function main(): Promise<void> {
  const data = JSON.parse(
    readFileSync(join(__filename, '..', 'agents3.json'), 'utf-8'),
  ) as BackupAgent[][];

  const cities = await prisma.city.findMany({ include: { state: true } });
  const states = await prisma.state.findMany();

  // for (const entries of data) {
  //   const allKeysMatch = entries.every((e) => {
  //     keys.every((k) => {
  //       if (k === 'id' || k === 'dateAdded' || k === 'company') {
  //         return true;
  //       }

  //       const match = e[k] === entries[0][k];

  //       if (!match) {
  //         console.log(k);
  //       }

  //       return match;
  //     });
  //   });

  //   if (!allKeysMatch) {
  //     console.log('Keys do not match');
  //     console.log(entries);
  //     console.log(entries[0].name);
  //     return;
  //   }
  // }

  //

  const names = JSON.parse(readFileSync(join(__filename, '..', 'names.json'), 'utf-8')) as string[];

  for (const entries of data) {
    const isColdwellBanker = entries.some((e) => e.company === 'Coldwell Banker');
    const companyName = isColdwellBanker
      ? entries.find((e) => e.company !== 'Coldwell Banker')?.company
      : undefined;

    // const cityReferences: City[] = [];
    const cityReferences: typeof cities = [];

    for (const e of entries) {
      const citySplit = e.city.split(/[- ]/);
      const cityUpperCased = citySplit.map((c) => c[0].toUpperCase() + c.slice(1)).join(' ');

      const existingCity = cities.find(
        (c) =>
          c.name.toLowerCase() === cityUpperCased.toLowerCase() &&
          c.state.name.toLowerCase() === e.state.toLowerCase(),
      );

      if (existingCity) {
        cityReferences.push(existingCity);
        continue;
      }

      const model = await prisma.city.upsert({
        where: {
          name: cityUpperCased,
          state: {
            name: e.state.toUpperCase(),
          },
        },

        update: {},

        create: {
          name: cityUpperCased,
          state: {
            connectOrCreate: {
              where: { name: e.state.toUpperCase() },
              create: { name: e.state.toUpperCase() },
            },
          },
        },
        include: { state: true },
      });

      cityReferences.push(model);

      // const model = await prisma.city.upsert({});

      // const existingModel = cities.find(
      //   (c) =>
      //     c.name.toLowerCase() === cityUpperCased.toLowerCase() &&
      //     c.state.name.toLowerCase() === e.state.toLowerCase(),
      // );

      // if (existingModel) {
      //   return existingModel;
      // }

      // const state = states.find((s) => s.name.toLowerCase() === e.state.toLowerCase());

      // const newCityModel = await prisma.city.

      // return {
      //   city: cityUpperCased,
      //   state: e.state.toUpperCase(),
      // };
    }

    // get agent data

    const { city, state, ...combined } = combineArrays(entries);

    const agent = {
      ...combined,
      company: companyName || combined.company,
      cities,
    };

    if (names.includes(agent.name)) {
      console.log(`skipping agent: ${agent.name}`);
      continue;
    }

    // console.log(agent);

    //     id                String        @id @default(cuid())
    // createdAt         DateTime      @default(now())
    // updatedAt         DateTime      @updatedAt
    // name              String        @unique
    // company           String?
    // phoneNumber       String?
    // cities            City[]
    // stars             Int?
    // experience        String?
    // activityRange     String?
    // jobTitle          String?
    // officePhoneNumber String?
    // directPhoneNumber String?
    // email             String?
    // office            String?
    // website           String?
    // socials           AgentSocials?
    // contacts          Contact[]

    const data = await prisma.agent.create({
      data: {
        name: agent.name,
        company: agent.company,
        phoneNumber: agent.phoneNumber,
        cities: {
          connect: cityReferences.map((c) => ({ id: c.id })),
        },
        stars: agent.stars ? Number(agent.stars) : undefined,
        experience: agent.experience,
        activityRange: agent.activityRange,
        jobTitle: agent.jobTitle,
        officePhoneNumber: agent.officePhoneNumber,
        directPhoneNumber: agent.directPhoneNumber,
        email: agent.email,
        office: agent.office,
        website: agent.website,
        facebook: agent.facebook,
        instagram: agent.instagram,
        tiktok: agent.tiktok,
        twitter: agent.twitter,
        linkedIn: agent.linkedIn,
        realtor: agent.realtorLink,
        coldwell: agent.coldwellLink,
        svn: agent.svnLink,
      },
    });

    names.push(data.name);
    writeFileSync(join(__filename, '..', 'names.json'), JSON.stringify(names, null, 2));
    console.log(`created agent: ${data.name}`);

    // TODO: go through each entry and create an array containing the state and city for each entry.
    // for each entry, add it to the database if it doesn't already exist. for each city, split it and
    // upper case the first letter of each word. for the state, upper case the whole thing.

    // remove `city` and `state` from the agent object, then add it to the `NewAgent` model in prisma,
    // also adding a reference to the various cities and states.
  }

  writeFileSync(join(__filename, '..', 'names.json'), JSON.stringify(names, null, 2));
  // writeFileSync(
  //   join(__filename, '..', 'cities.json'),
  //   JSON.stringify(Array.from(new Set(citie)), null, 2),
  // );

  //

  // const d: Record<string, T[]>[] = [];
  // type T = string | null | undefined | number;

  // for (const entries of data) {
  //   const keys = Object.keys(entries[0]);
  //   const newObject: Record<string, T[]> = {};

  //   for (const key of keys) {
  //     const array: T[] = [];

  //     for (const entry of entries) {
  //       array.push(entry[key as keyof BackupAgent]);
  //     }

  //     newObject[key] = array;
  //   }

  //   d.push(newObject);
  // }

  // writeFileSync(join(__filename, '..', 'combined.json'), JSON.stringify(d, null, 2));
}

function combineArrays(entries: BackupAgent[]): BackupAgent {
  const agent: Record<string, any> = entries[0];

  for (const entry of entries) {
    for (const key of keys) {
      if (entry[key]) {
        const value = entry[key];
        agent[key] = value;
      }
    }
  }

  return agent as BackupAgent;
}

main();
