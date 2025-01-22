import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import * as paths from '@/utils/paths';

export type Place = {
  city: string;
  state: string;
};

export type Counter = Place & {
  progress: 'DONE' | 'IN_PROGRESS' | 'NOT_STARTED';
};

export function importCounter(): Counter[] {
  if (!existsSync(paths.COUNTER)) {
    writeFileSync(paths.COUNTER, '[]');
  }

  return JSON.parse(readFileSync(paths.COUNTER, 'utf-8')) as Counter[];
}

export function updateCounter(counter: Counter): Counter[] {
  let counters = importCounter();
  const exists = counters.some((c) => c.city === counter.city && c.state === counter.state);

  if (!exists) {
    counters.push(counter);
  } else {
    counters = counters.map((c) =>
      c.city === counter.city && c.state === counter.state ? counter : c,
    );
  }

  writeFileSync(paths.COUNTER, JSON.stringify(counters, null, 2));
  return counters;
}

export function isCounterFinished(counter: Counter[], city: string, state: string): boolean {
  const exists = counter.some((c) => c.city === city && c.state === state);

  return exists
    ? counter.some((c) => c.city === city && c.state === state && c.progress === 'DONE')
    : false;
}
