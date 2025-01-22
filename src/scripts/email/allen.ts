import nodemailer from 'nodemailer';

import { readFileSync, write, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';

import type { Agent, City } from '@prisma/client';
import { keys } from './keys';
import { updateAgent } from './utils/agent';
import { email, ss } from './utils/email';
import { ensureKeys } from './utils/ensureKeys';

import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const DIR = join(__filename, '..');
const template = readFileSync(join(DIR, 'template.txt'), 'utf8');
const names = JSON.parse(readFileSync(join(DIR, 'names.json'), 'utf8')) as Record<
  string,
  SMTPTransport.SentMessageInfo
>;
const backup = JSON.parse(readFileSync(join(DIR, 'backup.json'), 'utf8')) as (Agent & {
  cities: City[];
})[];

function combine(array: string[]): string {
  const lastElement = array.pop();

  return lastElement && array.length > 0
    ? `${array.join(', ')} and ${lastElement}`
    : lastElement || '';
}

async function main(): Promise<void> {
  const CITIES_TO_EMAIL = ['Brookline', 'Needham', 'Newton', 'Wellesley', 'Weston'].map((c) =>
    c.toLowerCase(),
  );

  const data = backup.filter((agent) => {
    return agent.cities.some((city) => CITIES_TO_EMAIL.includes(city.name.toLowerCase()));
  });

  for (const agent of data) {
    if (agent.name in names) {
      continue;
    }

    if (!agent.email) {
      continue;
    }

    const cities = agent.cities
      .filter((city) => CITIES_TO_EMAIL.includes(city.name.toLowerCase()))
      .map((city) => city.name);

    const info = await ss(agent.email, combine(cities));
    names[agent.name] = info;
    writeFileSync(join(DIR, 'names.json'), JSON.stringify(names, null, 2));
  }
}

main();
