import { writeFileSync } from 'fs';
import data from './csv.json';

const keys = Object.keys(data[0]);
const lines: string[] = [keys.join(',')];

for (const row of data) {
  const values = keys.map((key) => row[key]);
  lines.push(
    values
      .map((x) => {
        if (typeof x === 'string') {
          return x.replace(/,/g, ' ');
        }

        return x;
      })
      .join(','),
  );
}

writeFileSync('src/scripts/email/csv.csv', lines.join('\n'));
