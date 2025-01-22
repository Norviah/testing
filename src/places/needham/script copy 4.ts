import fs, { writeFileSync } from 'node:fs';
import path from 'node:path';

import { Jimp, JimpInstance, intToRGBA } from 'jimp';

import * as paths from '@/utils/paths';
import { findLongestStreakOfBlackColor } from './utils';

const pdfPath = path.join(__dirname, 'data.pdf');

async function lines(buffer: Buffer, counter: number) {
  const firstPageImage = await Jimp.read(buffer);
  const secondPageImage = await Jimp.read(buffer);

  const height = firstPageImage.bitmap.height;
  const width = firstPageImage.bitmap.width;

  const record = {};

  const colors: { r: number; g: number; b: number; x: number; y: number; rgb: number | null }[] =
    [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = intToRGBA(firstPageImage.getPixelColor(x, y));
      const obj = {
        ...color,
        x,
        y,
        rgb: color.r === color.g && color.g === color.b ? color.a : null,
      };

      if (obj.rgb !== 255) {
        colors.push(obj);
      }
    }
  }

  // const longestStreak = findLongestStreakOfBlackColor(colors, 10, '<');
  // const secondSection = findLongestStreakOfBlackColor(colors, 217, '===');

  // if (longestStreak.longestStreak > 0) {
  //   record[y] = {
  //     streak: longestStreak,
  //   };
  // }

  // if (secondSection.longestStreak === 908) {
  //   record[y] = { ...record[y], section: secondSection };
  // }

  writeFileSync(path.join(paths.DATA, 'COLORS.json'), JSON.stringify(colors, null, 1));

  throw new Error('stop');

  // get the first Y coordinate with > 1000 streak
  let firstY = 0;
  let secondY = 0;

  for (const key in record) {
    if (record[key].longestStreak > 1000 && firstY === 0) {
      firstY = Number.parseInt(key);
    }

    if (record[key].longestStreak === 908 && secondY === 0) {
      secondY = Number.parseInt(key);
    }

    if (firstY && secondY) {
      break;
    }
  }

  const firstImage = firstPageImage.crop({
    x: 0,
    y: 0,
    w: firstPageImage.bitmap.width,
    h: firstY,
  });

  const secondImage = secondPageImage.crop({
    x: 0,
    y: firstY,
    w: firstPageImage.bitmap.width,
    h: Math.abs(firstY - height),
  });

  await firstImage.write(path.join(__dirname, 'img', `${counter}-1.png`) as `${string}.${string}`);
  await secondImage.write(path.join(__dirname, 'img', `${counter}-2.png`) as `${string}.${string}`);

  //
  console.log(firstY, secondY);
}

async function secondCut(firstImage: JimpInstance, secondImage: JimpInstance) {}

async function main() {
  const { pdf } = await import('pdf-to-img');

  let counter = 1;
  const document = await pdf(pdfPath, { scale: 3 });
  for await (const image of document) {
    fs.writeFileSync(path.join(__dirname, 'img', `${counter}.png`), image);
    await lines(image, counter);

    console.log(`Page ${counter} done`);

    counter++;

    throw new Error('stop');
  }
}

main();
