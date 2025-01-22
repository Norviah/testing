import nodemailer from 'nodemailer';

import { readFileSync, write, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@/utils/db';

import type { Config, Password } from '@/utils/config';
import type { Agent, City } from '@prisma/client';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const DIR = join(__filename, '..', '..');
const names = JSON.parse(readFileSync(join(DIR, 'names.json'), 'utf8')) as string[];

// let template = readFileSync(join(DIR, 'template.txt'), 'utf8');
let template: string;
let auth: Password;
let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

export function createTransporter({
  config,
  a,
  template_path,
}: { config: Config; a: Password; template_path: string }) {
  transporter = nodemailer.createTransport({
    host: config.EMAIL_SERVER_HOST,
    port: Number(config.EMAIL_SERVER_PORT),
    secure: false,
    auth: {
      user: a.USER,
      pass: a.PASSWORD,
    },
  });

  auth = a;

  template = readFileSync(template_path, 'utf8');
}

// export async function email(agent: Agent, city: City): Promise<SMTPTransport.SentMessageInfo> {
//   const text = `${template
//     .trim()
//     .replace(/\n/g, '<br />')
//     .replace(/\[City\]/g, city.name)
//     .replace(/\[Name\]/g, agent.name)}
//         <br /><br />
//   <img src="cid:unique@nodemailer.com" width="400" height="150"/>
//       `.trim();

//   const info = await transporter.sendMail({
//     from: auth.FROM,
//     to: 'arielmb@bu.edu',
//     subject: 'Acquiring off Market Properties - TEST EMAIL',
//     // cc: ['ilya@triobuilds.com'],
//     cc: ['jmasresha@gmail.com'],
//     html: text,
//     attachments: [
//       {
//         filename: 'TrioDevelopment.png',
//         path: join(DIR, 'image.png'),
//         cid: 'unique@nodemailer.com', //same cid value as in the html img src
//       },
//     ],
//   });

//   return info;
// }

// export async function manualEmailTEST(
//   to: string,
//   city: string,
// ): Promise<SMTPTransport.SentMessageInfo> {
//   const text = `${template
//     .trim()
//     .replace(/\n/g, '<br />')
//     .replace(/\[City\]/g, city)
//     .replace(/\[Name\]/g, to)}
//         <br /><br />
//   <img src="cid:unique@nodemailer.com" width="400" height="150"/>
//       `.trim();

//   console.log(text);

//   const info = await transporter.sendMail({
//     from: auth.FROM,
//     to: 'arielmb@bu.edu',
//     subject: 'Acquiring off Market Properties - TEST EMAIL',
//     // cc: ['ilya@triobuilds.com'],
//     cc: ['jmasresha@gmail.com'],
//     html: text,
//     attachments: [
//       {
//         filename: 'TrioDevelopment.png',
//         path: join(DIR, 'image.png'),
//         cid: 'unique@nodemailer.com', //same cid value as in the html img src
//       },
//     ],
//   });

//   return info;
// }

export async function email({
  to,
  subject,
  city,
  cc,
  name,
}: {
  to: string;
  subject: string;
  city: string;
  cc?: string[];
  name: string;
}): Promise<SMTPTransport.SentMessageInfo> {
  const text = `${template
    .trim()
    .replace(/\n/g, '<br />')
    .replace(/\[City\]/g, city)
    .replace(/\[Name\]/g, name)}
        <br /><br />
  <img src="cid:unique@nodemailer.com" width="400" height="150"/>
      `.trim();

  const info = await transporter.sendMail({
    from: auth.FROM,
    to: to,
    subject: subject,
    cc,
    // cc: ['jmasresha@gmail.com'],
    // cc: ['ilya@triobuilds.com'],
    html: text,
    attachments: [
      {
        filename: 'TrioDevelopment.png',
        path: join(DIR, 'image.png'),
        cid: 'unique@nodemailer.com', //same cid value as in the html img src
      },
    ],
  });

  return info;
}
