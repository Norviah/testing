import { join } from 'node:path';
import * as paths from '@/utils/paths';

export * from '@/utils/paths';

export const COMPANIES_SVN: string = join(paths.COMPANIES, 'svn');
