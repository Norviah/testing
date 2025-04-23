import { existsSync, mkdirSync, readFileSync, rm, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import bcrypt from 'bcrypt';
import { Jimp, type RGBAColor, intToRGBA } from 'jimp';

import { join } from 'node:path';
import * as paths from '@/utils/paths';
import { createWorker } from 'tesseract.js';

import { createHash } from 'node:crypto';

// const util = require('node:util');
// const

import { exec as rawExec } from 'node:child_process';
import util from 'node:util';
import { SavedPermitDataStructure } from '@/types';

const exec = util.promisify(rawExec);

function colorIs(color: RGBAColor, target: number) {
  return color.r === target && color.g === target && color.b === target;
}

export async function parse() {
  const script = `${paths.PYTHON_ACTIVATION_SOURCE} && python ${paths.PYTHON_SCRIPT} ${paths.STOUGHTON_PDF} ${paths.STOUGHTON_COMBINED_PICTURE}`;
  const s = await exec(script);

  if (s.stderr) {
    throw new Error(s.stderr);
  }

  const imageBuffer = readFileSync(paths.STOUGHTON_COMBINED_PICTURE);
  const image = await Jimp.read(imageBuffer);
  const worker = await createWorker();

  const height = image.bitmap.height;
  const width = image.bitmap.width;

  if (existsSync(paths.STOUGHTON_PICTURES)) {
    rmSync(paths.STOUGHTON_PICTURES, { recursive: true });
  }

  mkdirSync(paths.STOUGHTON_PICTURES, { recursive: true });

  const headers = await getHeaderBreakpoints(image);
  const sections: { from: number; to: number; color: RGBAColor }[] = [];

  let last: { y: number; color: RGBAColor } | undefined;

  for (let y = 0; y < height; y++) {
    const color = intToRGBA(image.getPixelColor(40, y));

    if (!last) {
      last = { y, color };
      continue;
    }

    if (same(color, last.color)) {
      continue;
    }

    sections.push({ from: last.y, to: y - 1, color: last.color });
    last = { y, color };
  }

  const rawData: string[][] = [];

  for (const [i, section] of sections.entries()) {
    const text: string[] = [];
    const imageSection = image.clone().crop({
      x: 0,
      y: section.from,
      w: width,
      h: section.to - section.from,
    });

    // await imageSection.write(
    //   join(paths.STOUGHTON_PICTURES, `${section.from}-${section.to}.jpg`) as `${string}.${string}`,
    // );
    // console.log(join(paths.STOUGHTON_PICTURES, `${section.from}-${section.to}.jpg`));

    for (const header of headers) {
      // try {
      //   const imageSection = image.clone().crop({
      //     x: header.from,
      //     y: section.from,
      //     w: header.to - header.from,
      //     h: section.to - section.from,
      //   });
      //   const {
      //     data: { text: rawText },
      //   } = await worker.recognize(await imageSection.getBuffer('image/jpeg'));
      //   text.push(rawText);
      // } catch (e) {}

      if (imageSection.bitmap.height === 0) {
        continue;
      }

      const headerImage = imageSection.clone().crop({
        x: header.from,
        y: 0,
        w: header.to - header.from,
        h: imageSection.bitmap.height,
      });

      // await headerImage.write(
      //   join(
      //     paths.STOUGHTON_PICTURES,
      //     `${i}-${header.from}-${header.to}.jpg`,
      //   ) as `${string}.${string}`,
      // );

      // check if headerImage is valid

      // await new Promise((resolve) => setTimeout(resolve, 500));

      // try {
      const {
        data: { text: rawText },
      } = await worker.recognize(await headerImage.getBuffer('image/jpeg'));
      text.push(rawText);
      // } catch (e) {}
    }

    rawData.push(text);
  }

  // const rawData = JSON.parse(
  //   readFileSync(join(paths.DATA, 'parsed text copy.json')).toString(),
  // ) as string[][];

  const data = rawData
    .filter((data) => {
      if (data.length === 0) {
        return false;
      }

      const id = data[0].length > 0 ? data[0].trim().replaceAll('\n', '') : undefined;

      if (id ? !/^([A-Za-z0-9]{0,3}-)?[A-Za-z0-9]{0,3}-[A-Za-z0-9]{0,4}$/.test(id) : false) {
        return false;
      }

      return true;
    })
    .map((data) => {
      return data.map((text) => text.trim().replaceAll('\n', ''));
    })
    .map((data) => {
      const id = data[0];

      if (!id) {
        // const newId = Buffer.from(
        //   `${data[1]}-${data[2]}-${data[4]}-${data[5]}-${data[7]}`,
        // ).toString('base64');

        // data[0] = newId.length > 200 ? newId.slice(0, 200) : newId;

        data[0] = bcrypt.hashSync(`${data[1]}-${data[2]}-${data[4]}-${data[5]}-${data[7]}`, 10);
      }

      return data;
    });

  await worker.terminate();
  // writeFileSync(join(paths.DATA, 'parsed text.json'), JSON.stringify(data, null, 2));
  const parsedData: SavedPermitDataStructure<'Stoughton', 'MA'>[] = [];

  // data headers:
  // permitnumber | application date | issue date | payment date | applicant | owner | map loot block & site address | description | cost | fees | transcription method

  // map loot block & site address is in the format of:
  // DD-DDD-DDDDD ADDRESS, have to filter out the random digits

  for (const d of data) {
    try {
      parsedData.push({
        permitnumber: d[0],
        issued_date: /^\d{2}\/\d{2}\/\d{4}$/.test(d[2])
          ? d[2] === '00/00/0000'
            ? undefined
            : d[2]
          : undefined,
        applicant: d[4],
        owner: d[5],
        address: /(\d+-?)+ (.*)/.exec(d[6])![2],
        description: d[7],
        total_fees: d[8],
        city: 'Stoughton',
        state: 'MA',
      });
    } catch {}
  }

  writeFileSync(paths.STOUGHTON_DATA, JSON.stringify(parsedData, null, 2));
}

async function getHeaderBreakpoints(image: Awaited<ReturnType<(typeof Jimp)['read']>>) {
  const sections: { from: number; to: number }[] = [];
  let lastX: number | undefined = 39;

  for (let x = 40; x < 1642; x++) {
    const color = intToRGBA(image.getPixelColor(x, 156));

    if (x === 1642 - 1) {
      sections.push({ from: lastX! + 1, to: x });
      break;
    }

    if (!(color.r === 40 && color.g === 127 && color.b === 186)) {
      sections.push({ from: lastX! + 1, to: x - 1 });

      lastX = x;
    }
  }

  return sections;
}

function isDivider(color: RGBAColor) {
  // return color.r === 84 && color.g === 153 && color.b === 200;
  return !(color.r === 40 && color.g === 127 && color.b === 186);
}

function same(color1: RGBAColor, color2: RGBAColor) {
  return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
}
