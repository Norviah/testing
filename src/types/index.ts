import type { Permit } from '@prisma/client';

export type SavedPermitDataStructure<City extends string, State extends string> = Omit<
  Partial<Permit>,
  | 'id'
  | 'city'
  | 'issued_date'
  | 'expiration_date'
  | 'applied_date'
  | 'finalized_date'
  | 'permitnumber'
> & {
  city: City;
  state: State;
  issued_date?: string | null;
  expiration_date?: string | null;
  applied_date?: string | null;
  finalized_date?: string | null;
  permitnumber: string;
  isDemo?: boolean;
};

export type SavedPermitDataStructureWithDate<City extends string, State extends string> = Omit<
  SavedPermitDataStructure<City, State>,
  'issued_date' | 'expiration_date' | 'applied_date' | 'finalized_date'
> & {
  issued_date: Date | null;
  expiration_date: Date | null;
  applied_date: Date | null;
  finalized_date: Date | null;
};
