import { join } from 'node:path';
import { path as root } from 'app-root-path';

export const ROOT: string = root;
export const SRC: string = join(ROOT, 'src');
export const WEBSITES: string = join(SRC, 'websites');

export const PYTHON_DIR: string = join(ROOT, 'python');
export const PYTHON_ACTIVATION_SOURCE: string =
  process.platform === 'win32' ? join(PYTHON_DIR, 'env', 'Scripts', 'activate') : `source ${join(PYTHON_DIR, 'env', 'bin', 'activate')}`;
export const PYTHON_SCRIPT: string = join(PYTHON_DIR, 'main.py');

export const DATA: string = join(ROOT, 'data');
export const CONFIG: string = join(ROOT, 'config.json');
export const PERMITS: string = join(DATA, 'permits');
export const BACKUP: string = join(DATA, 'backup');
export const BOARDS: string = join(ROOT, 'boards.json');

export const WOBURN: string = join(PERMITS, 'woburn');
export const WOBURN_DATA: string = join(WOBURN, 'data.json');

export const MEDWAY: string = join(PERMITS, 'medway');
export const MEDWAY_DATA: string = join(MEDWAY, 'data.json');

export const NEEDHAM: string = join(PERMITS, 'needham');
export const NEEDHAM_DATA: string = join(NEEDHAM, 'data.json');
export const NEEDHAM_PDF: string = join(NEEDHAM, 'data.pdf');
export const NEEDHAM_PICTURES: string = join(NEEDHAM, 'pictures');
export const NEEDHAM_COMBINED_PICTURE: string = join(NEEDHAM, 'combined.png');

export const STOUGHTON: string = join(PERMITS, 'stoughton');
export const STOUGHTON_DATA: string = join(STOUGHTON, 'data.json');
export const STOUGHTON_PDF: string = join(STOUGHTON, 'data.pdf');
export const STOUGHTON_PICTURES: string = join(STOUGHTON, 'pictures');
export const STOUGHTON_COMBINED_PICTURE: string = join(STOUGHTON, 'combined.png');

export const WEST_ROXBURY: string = join(PERMITS, 'west-roxbury');
export const WEST_ROXBURY_RAW: string = join(WEST_ROXBURY, 'raw.csv');
export const WEST_ROXBURY_DATA: string = join(WEST_ROXBURY, 'data.json');

export const LEXINGTON: string = join(PERMITS, 'lexington');
export const LEXINGTON_RAW: string = join(LEXINGTON, 'raw.csv');
export const LEXINGTON_DATA: string = join(LEXINGTON, 'data.json');

export const BROCKTON: string = join(PERMITS, 'brockton');
export const BROCKTON_DATA: string = join(BROCKTON, 'data.json');

export const BROOKLINE: string = join(PERMITS, 'brookline');
export const BROOKLINE_DATA: string = join(BROOKLINE, 'data.json');

export const NORWOOD: string = join(PERMITS, 'norwood');
export const NORWOOD_DATA: string = join(NORWOOD, 'data.json');

export const NEWTON: string = join(PERMITS, 'newton');
export const NEWTON_DATA: string = join(NEWTON, 'data.json');
export const NEWTON_RAW: string = join(NEWTON, 'raw.csv');

export const MILTON: string = join(PERMITS, 'milton');
export const MILTON_DATA: string = join(MILTON, 'data.json');

export const EASTON: string = join(PERMITS, 'easton');
export const EASTON_DATA: string = join(EASTON, 'data.json');

export const FOXBOROUGH: string = join(PERMITS, 'foxborough');
export const FOXBOROUGH_DATA: string = join(FOXBOROUGH, 'data.json');

export const HINGHAM: string = join(PERMITS, 'hingham');
export const HINGHAM_DATA: string = join(HINGHAM, 'data.json');

export const WESTON: string = join(PERMITS, 'weston');
export const WESTON_DATA: string = join(WESTON, 'data.json');

export const REALTORS: string = join(DATA, 'realtors');
export const REALTORS_BEDFORD_MA: string = join(REALTORS, 'bedford-ma');
export const REALTORS_BEDFORD_MA_DATA: string = join(REALTORS, 'bedford-ma', 'data.json');

export const COUNTER: string = join(DATA, 'counter.json');

export const COMPANIES: string = join(DATA, 'companies');
export const COMPANIES_COLDWELL: string = join(COMPANIES, 'coldwell');
export const COLDWELL_COUNTER: string = join(COMPANIES_COLDWELL, 'counter.json');

export const COMPANIES_SVN: string = join(COMPANIES, 'svn');
export const COMPANIES_SVN_DATA: string = join(COMPANIES_SVN, 'data.json');

export const COMPANIES_COMPASS: string = join(COMPANIES, 'compass');

export const COMPANIES_HAMMOND: string = join(COMPANIES, 'hammond');
