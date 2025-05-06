// const { Jimp, intToRGBA, crop: jimpCrop } = require('jimp');
// const fs = require('node:fs');
// const path = require('node:path');
// const { PDFDocument } = require('pdf-lib');
// const { pdf } = require('pdf-to-img');

import fs, { writeFileSync } from 'node:fs';
import path from 'node:path';

import { Jimp, intToRGBA } from 'jimp';
import { PDFDocument } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import { findLongestStreakOfBlackColor } from './utils';

import * as paths from '@/utils/paths';

// import PDF file
const pdfPath = path.join(__dirname, 'data.pdf');
const parsedPath = path.join(__dirname, 'parsed.pdf');

async function lines(buffer: Buffer, counter: number) {
  const pageImage = await Jimp.read(buffer);

  const height = pageImage.bitmap.height;
  const width = pageImage.bitmap.width;

  const record = {};

  let dividerY: number | null = null;
  let sectionX: number | null = null;

  for (let y = 0; y < height; y++) {
    const colors: { r: number; g: number; b: number; x: number; y: number }[] = [];

    for (let x = 0; x < width; x++) {
      colors.push({ ...intToRGBA(pageImage.getPixelColor(x, y)), x, y });
    }

    const longestStreak = findLongestStreakOfBlackColor(colors, 10, '<');
    const secondSection = findLongestStreakOfBlackColor(colors, 217, '===');

    if (longestStreak.longestStreak > 1000 && !dividerY) {
      dividerY = y;
    }

    if (secondSection.longestStreak === 908 && !sectionX) {
      // console.log(secondSection);
      sectionX = secondSection.x;
    }

    if (dividerY && sectionX) {
      break;
    }
  }

  if (!dividerY || !sectionX) {
    throw new Error(`No divider or section found for ${counter}`);
  }

  const firstPermit = pageImage.clone().crop({
    x: 0,
    y: 0,
    w: pageImage.bitmap.width,
    h: dividerY,
  });

  const HARD_CODED_X = 1309;

  const firstPermitFirstHalf = pageImage.clone().crop({
    x: 0,
    y: 0,
    w: HARD_CODED_X,
    h: dividerY,
  });

  const firstPermitSecondHalf = pageImage.clone().crop({
    x: HARD_CODED_X,
    y: 0,
    w: pageImage.bitmap.width - HARD_CODED_X,
    h: dividerY,
  });

  const secondPermit = pageImage.clone().crop({
    x: 0,
    y: dividerY,
    w: pageImage.bitmap.width,
    h: Math.abs(dividerY - height),
  });

  const secondPermitFirstHalf = pageImage.clone().crop({
    x: 0,
    y: dividerY,
    w: HARD_CODED_X,
    h: Math.abs(dividerY - height),
  });

  const secondPermitSecondHalf = pageImage.clone().crop({
    x: HARD_CODED_X,
    y: dividerY,
    w: pageImage.bitmap.width - HARD_CODED_X,
    h: Math.abs(dividerY - height),
  });

  await save(firstPermit, `${counter}-1.png`);
  await save(firstPermitFirstHalf, `${counter}-1-1.png`);
  await save(firstPermitSecondHalf, `${counter}-1-2.png`);

  await save(secondPermit, `${counter}-2.png`);
  await save(secondPermitFirstHalf, `${counter}-2-1.png`);
  await save(secondPermitSecondHalf, `${counter}-2-2.png`);

  //

  const worker = await createWorker();

  const {
    data: { text },
  } = await worker.recognize(path.join(__dirname, 'img', `${counter}-2-1.png`));
  // console.log(text);
  // console.log('---');
  const {
    data: { text: text2 },
  } = await worker.recognize(path.join(__dirname, 'img', `${counter}-2-2.png`));
  // console.log(text2);
  await worker.terminate();

  // await firstPermit.write(path.join(__dirname, 'img', `${counter}-1.png`) as `${string}.${string}`);
  // await firstPermitFirstHalf.write(
  //   path.join(__dirname, 'img', `${counter}-1-1.png`) as `${string}.${string}`,
  // );
  // await firstPermitSecondHalf.write(
  //   path.join(__dirname, 'img', `${counter}-1-2.png`) as `${string}.${string}`,
  // );

  // await secondPermit.write(
  //   path.join(__dirname, 'img', `${counter}-2.png`) as `${string}.${string}`,
  // );
  // await secondPermitFirstHalf.write(
  //   path.join(__dirname, 'img', `${counter}-2-1.png`) as `${string}.${string}`,
  // );
  // await secondPermitSecondHalf.write(
  //   path.join(__dirname, 'img', `${counter}-2-2.png`) as `${string}.${string}`,
  // );
}

async function save(picture: any, pathh: string) {
  await picture.write(path.join(__dirname, 'img', pathh) as `${string}.${string}`);
}

async function main() {
  const { pdf } = await import('pdf-to-img');

  let counter = 1;
  const document = await pdf(pdfPath, { scale: 3 });
  for await (const image of document) {
    fs.writeFileSync(path.join(__dirname, 'img', `${counter}.png`), image);
    await lines(image, counter);

    // console.log(`Page ${counter} done`);

    counter++;

    throw new Error('stop');
  }

  // fs.writeFileSync(path.join(__dirname, "page.png"), Buffer.from(result));
  // await instance.close();
}

main();
