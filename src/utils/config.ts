import { readFileSync } from 'node:fs';
import { z } from 'zod';

import * as paths from '@/utils/paths';

export const passwordSchema = z.object({
  USER: z.string(),
  PASSWORD: z.string(),
  FROM: z.string(),
});

export type Password = z.infer<typeof passwordSchema>;

export const schema = z.object({
  ACCESS_TOKEN: z.string(),
  // EMAIL_SERVER_USER: z.string(),
  // EMAIL_SERVER_PASSWORD: z.string(),

  personal: passwordSchema,
  adam: passwordSchema,
  allen: passwordSchema,
  mh: passwordSchema,

  EMAIL_SERVER_HOST: z.string(),
  EMAIL_SERVER_PORT: z.string(),

  OS: z.enum(['windows', 'mac', 'linux']),
});

export type Config = z.infer<typeof schema>;

export const config = schema.parse(JSON.parse(readFileSync(paths.CONFIG, 'utf-8')));

export const browserConfig =
  config.OS === 'windows'
    ? {
        headless: false,
      }
    : {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        // dumpio: true,
        timeout: 0,
        // args: ['--no-sandbox', '--disable-setuid-sandbox'],
      };
