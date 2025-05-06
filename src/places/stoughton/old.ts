import { existsSync, mkdirSync, readFileSync, rm, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { Jimp, intToRGBA } from 'jimp';

import { join } from 'node:path';
import { SavedPermitDataStructure } from '@/types';
import * as paths from '@/utils/paths';
import { createWorker } from 'tesseract.js';

export async function parse() {
  // const imageBuffer = readFileSync(paths.STOUGHTON_COMBINED_PICTURE);
  // const image = await Jimp.read(imageBuffer);
  // const worker = await createWorker();

  // const height = image.bitmap.height;
  // const width = image.bitmap.width;
  // let textArray: string[] = [];

  // let started = false;

  // const white = 255;
  // const grey = 241;
  // let currentCOlor: typeof white | typeof grey | undefined;

  // let lastY: number | undefined;
  // let num = 0;

  // if (existsSync(paths.STOUGHTON_PICTURES)) {
  //   rmSync(paths.STOUGHTON_PICTURES, { recursive: true });
  // }

  // mkdirSync(paths.STOUGHTON_PICTURES, { recursive: true });

  // for (let y = 0; y < height; y++) {
  //   const color = intToRGBA(image.getPixelColor(36, y));

  //   if (!started) {
  //     if (color.r === 203 && color.g === 221 && color.b === 241) {
  //       started = true;
  //     }

  //     continue;
  //   }

  //   if (currentCOlor === undefined) {
  //     currentCOlor = color.r === white ? white : grey;
  //     lastY = y;
  //   }

  //   const indexColor = color.r === white ? white : color.r === grey ? grey : undefined;

  //   if (indexColor && currentCOlor !== indexColor) {
  //     // sections.push({ from: lastY!, to: y });

  //     // const sectionImage = image.clone().crop({
  //     //   x: 0,
  //     //   y: section.from,
  //     //   w: width,
  //     //   h: section.to - section.from,
  //     // });

  //     const section = image.clone().crop({
  //       x: 0,
  //       y: lastY!,
  //       w: width,
  //       h: y - lastY!,
  //     });

  //     // const imgPath = join(paths.STOUGHTON_PICTURES, `${num}.png`);
  //     // num++;
  //     // await section.write(imgPath as `${string}.${string}`);

  //     currentCOlor = indexColor;
  //     lastY = y;

  //     const {
  //       data: { text: rawText },
  //     } = await worker.recognize(await section.getBuffer('image/jpeg'));

  //     const tex = rawText.trim().split('\n');

  //     // text.push(rawText.trim());
  //     textArray = textArray.concat(tex);
  //   }

  //   if (y === height - 1) {
  //     // sections.push({ from: lastY!, to: y });
  //     const section = image.clone().crop({
  //       x: 0,
  //       y: lastY!,
  //       w: width,
  //       h: y - lastY!,
  //     });

  //     const {
  //       data: { text: rawText },
  //     } = await worker.recognize(await section.getBuffer('image/jpeg'));

  //     const tex = rawText.trim().split('\n');

  //     // text.push(rawText.trim());
  //     textArray = textArray.concat(tex);
  //   }
  // }

  // // worker.terminate();
  // // // console.log(text);
  // const ftextArray = textArray.filter((text) => {
  //   if (text === '') {
  //     return false;
  //   }

  //   if (text.toLowerCase().startsWith('permit cat')) {
  //     return false;
  //   }

  //   // check if string has these matches:
  //   // day, day, \d
  //   // page[optional space]\d+of[optional space]\d+

  //   if (
  //     text.toLowerCase().match(/page[ \d]+of[ \d]+/) ||
  //     text.toLowerCase().match(/[a-z]+, [a-z]+ \d+, \d{4}/i)
  //   ) {
  //     return false;
  //   }

  //   return true;
  // });

  // worker.terminate();
  // writeFileSync(join(paths.DATA, 'text.json'), JSON.stringify(ftextArray, null, 2));
  // writeFileSync(join(paths.DATA, 'text raw.json'), JSON.stringify(textArray, null, 2));

  //

  const text = JSON.parse(readFileSync(join(paths.DATA, 'text.json'), 'utf-8')) as string[];
  // // const sections: string[][] = [];

  const sections: string[][] = text.reduce((previous: string[][], current: string): string[][] => {
    const newArray = previous.slice();
    const last = newArray[newArray.length - 1];

    const isNewSection = isID(current);

    if (isNewSection) {
      newArray.push([current]);
    } else {
      last.push(current);
    }

    return newArray;
  }, [] as string[][]);

  const data: SavedPermitDataStructure<'Stoughton', 'MA'>[] = [];

  for (const section of sections) {
    data.push(parsee(section));
  }

  // writeFileSync(join(paths.DATA, 'parsed.json'), JSON.stringify(data, null, 2));
  // writeFileSync(join(paths.STOUGHTON, 'raw data.json'), JSON.stringify(data, null, 2));
  writeFileSync(paths.STOUGHTON_DATA, JSON.stringify(data, null, 2));

  // const parsedData: SavedPermitDataStructure<'Stoughton', 'MA'>[] = [];

  // for (const entry of data) {
  //   const parsed: SavedPermitDataStructure<'Stoughton', 'MA'> = {};
  // }
}

// section headers:
// permit # | category | last name | first name | type of construction | site address | fee | estimate | date granted
//
// note: these values are NOT separated by |, they are separated by spaces
function parsee(section: string[]): SavedPermitDataStructure<'Stoughton', 'MA'> {
  // header section

  const header = section[0];
  const [permit, category, ...rest] = header.split(' ');

  // const restJoin = rest.join(' ');
  // remove non-alphanumeric characters but also keep: /, ., and -
  const restJoin = rest
    .join(' ')
    .trim()
    .replace(/[^a-zA-Z0-9\/\.\- ,$]/g, '');

  let idk: string;

  // const initialMatch = restJoin.match(/^\d{2}-\d{2,3}/);
  const initialMatch = restJoin.match(/^([^0-9]*)/);

  const startsWithNumber = restJoin.match(/^\d/);
  if (!startsWithNumber) {
    // if (!initialMatch) {
    // idk = restJoin.match(/^([^0-9]*)/)![0].trim();
    // idk = initialMatch![0].trim();
    idk = restJoin.match(/^.*?(?=\d{2,})/)![0].trim();
  } else {
    idk = restJoin.match(/^(?:[^\d]*\d+[^\d]*)/i)![0].trim();
  }

  const rest2 = restJoin.replace(idk, '').trim();
  // const grouped = rest2.match(/^(?<address>[^$]+)(?<fee>\$[^$]+)(?<estimate>\$[^ ]+)(?<date>.*)/);
  // const grouped = rest2.trim().match(/^(?<fee>[^ ]+) ?(?<estimate>[^ ]+) ?(?<date>[^ ]+)$/);
  const grouped = rest2
    .trim()
    .match(/(?<address>[^$]+) (?<fee>[^ ]+) ?(?<estimate>[^ ]+) ?(?<date>[^ ]+)/);

  if (permit === '24-223') {
    // console.log(restJoin);
    // console.log(rest2);
    // console.log(idk);
  }

  const address = grouped?.groups?.address?.trim();
  const fee = grouped?.groups?.fee?.trim();
  const estimate = grouped?.groups?.estimate?.trim();
  const date = grouped?.groups?.date?.trim();

  // const data: Record<string, any> = {
  //   permit,
  //   category,
  //   address,
  //   fee,
  //   estimate,
  //   dateGranted: date,
  // };

  const rest3 = restJoin
    .replace(grouped?.[0]!, '')
    .trim()
    .split(' ')
    .filter((x) => x !== '');

  let type: string | undefined;
  let lastName: string | undefined;
  let firstName: string | undefined;

  if (rest3.length === 3) {
    const [rawLastName, rawFirstName, rawType] = rest3;

    type = rawType;
    lastName = rawLastName;
    firstName = rawFirstName;
  } else if (rest3.length === 2) {
    const [rawLastName, rawType] = rest3;

    lastName = rawLastName;
    type = rawType;
  } else {
    const [rawLastName, rawFirstName, ...rest4] = rest3;

    lastName = rawLastName;
    firstName = rawFirstName;
    type = rest4.join(' ');
  }

  // contractor section

  const line2 = section[1];

  let contractorName: string | undefined;
  let contractorAddress: string | undefined;
  let contractorNumber: string | undefined;

  if (line2.toLowerCase().startsWith('contractor')) {
    const [, information] = line2.toLowerCase().split(':');
    const exp = information.match(/^(?<name>[^,]+)(?<address>.*)(Tel # (?<number>\d+))$/i);

    contractorName = exp?.groups?.name?.trim();
    contractorAddress = exp?.groups?.address?.trim();
    contractorNumber = exp?.groups?.number?.trim();

    // const finalData = {
    //   ...data,
    //   contractorName,
    //   contractorAddress,
    //   contractorNumber,
    // } as Record<string, any>;

    //   const address = grouped?.groups?.address?.trim();
    // const fee = grouped?.groups?.fee?.trim();
    // const estimate = grouped?.groups?.estimate?.trim();
    // const date = grouped?.groups?.date?.trim();

    // let type: string | undefined;
    // let lastName: string | undefined;
    // let firstName: string | undefined;
  }

  return {
    permitnumber: permit,
    permittypedescr: category,
    worktype: type,
    owner: `${firstName} ${lastName}`,
    // type: type,
    address: address,
    total_fees: estimate,
    // estimate: estimate,
    issued_date: date,
    contractor: contractorName,
    contractor_address: contractorAddress?.replace(/^, ?|,$/g, ''),
    contractor_phone: contractorNumber,
    city: 'Stoughton',
    state: 'MA',
  };
}

function isID(text: string) {
  if (text.match(/^\d{2}-\d{2,3}/)) {
    return true;
  }

  if (text.match(/^\d{2}-[a-zA-Z0-9]{1,2}-\d{2,3}/i)) {
    return true;
  }

  return false;
}

parse();
