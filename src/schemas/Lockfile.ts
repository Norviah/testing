import { z } from 'zod';

export const State = {
  InProgress: 'InProgress',
  Standby: 'Standby',
} as const;

export type State = (typeof State)[keyof typeof State];

export const Structure = z.object({
  state: z.nativeEnum(State),
});

export type Structure = z.infer<typeof Structure>;
