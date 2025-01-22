import { readFileSync } from 'node:fs';

import * as paths from '@/utils/paths';

type Agent = {
  name: string;
  company: string | undefined;
  activityRange: string | undefined;
  stars: number | undefined;
  realtorLink: string | undefined;
  experience: string | undefined;
  phoneNumber: string | undefined;
  state: string;
  city: string;
};
