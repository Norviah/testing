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

async function lines(buffer: Buffer, counter: number) {
  const pageImage = await Jimp.read(buffer);

  const height = pageImage.bitmap.height;
  const width = pageImage.bitmap.width;

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
    data: { text: firstPermitFirstHalfText },
  } = await worker.recognize(path.join(__dirname, 'img', `${counter}-1-1.png`));
  const {
    data: { text: firstPermitSecondHalfText },
  } = await worker.recognize(path.join(__dirname, 'img', `${counter}-1-2.png`));

  const {
    data: { text: secondPermitFirstHalfText },
  } = await worker.recognize(path.join(__dirname, 'img', `${counter}-2-1.png`));
  const {
    data: { text: secondPermitSecondHalfText },
  } = await worker.recognize(path.join(__dirname, 'img', `${counter}-2-2.png`));

  await worker.terminate();

  // // console.log(text, text2);
  const firstPermitObject = getObject(firstPermitFirstHalfText, firstPermitSecondHalfText);
  const secondPermitObject = getObject(secondPermitFirstHalfText, secondPermitSecondHalfText);

  // console.log(firstPermitSecondHalfText);
  // console.log(secondPermitSecondHalfText);

  // console.log(firstPermitObject);
  // console.log(secondPermitObject);
  // // console.log(object);
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

function getObject(firstHalfText: string, secondHalfText: string) {
  //   const firstHalfText = `
  //   PERMIT # DATE: MBL# STATUS

  // BR-24-10209 04/01/2024 1990410006800000 Active

  // PERMIT TYPE ZONING

  // Residential SRB

  // ADDRESS

  // 233 WARREN ST, Needham, MA 02492

  // CONST. TYPE USE GROUP FOUNDATION

  // New Construction R3 Poured Concrete

  // DESCRIPTION

  // Construct a single family dwelling, SRB District, 12000 SF lot, 2.5 stories, 5 bedrooms, 6 baths, 2 car

  // garage, finished attic, finished basement, porch, no deck, 2 gas fireplace(s). FAR allowed= 4320 sf. FAR ESTIMATED COST
  // actual= 4319 sf, First Floor= 2064 sf, Second Floor= 2255 sf, Attic= 1000 sf, Basement= 1543 sf, Garage = $1,500,000
  // `.trim();

  const textArray = firstHalfText
    .trim()
    .split('\n')
    .filter((text) => text.trim() !== '');

  const [permitnumber, date, mbl, status] = textArray[1].split(' ');
  const [permitType, zoning] = textArray[3].split(' ');
  const address = textArray[5];

  const descriptionIndex = textArray.findIndex(
    (text) => text.toLowerCase() === 'DESCRIPTION'.toLowerCase(),
  );

  let descriptionString = textArray
    .slice(descriptionIndex + 1)
    .join(' ')
    .replace(/ESTIMATED COST/g, '');

  const totalFees = descriptionString.match(/\$[0-9,]+/g)![0];

  descriptionString = descriptionString.replace(totalFees, '').trim();

  const object: Record<string, string> = {
    permitnumber,
    date,
    mbl,
    status,
    permitType,
    zoning,
    address,
    description: descriptionString,
    moneyCount: totalFees,
  };

  //   const secondHalfText = `
  // OWNER
  // Petrini Corporation 187 Rosemary Street, Needham, MA 02494
  // ARCHITECT
  // Scott Melching Scott Melching Architect
  // LLC 116 Arch Street Needham MA 02492
  // Registration # 32162 (718) 578-3354
  // CONTRACTOR
  // Christopher Brunelli 187 Rosemary Street Needham MA 02494
  // Licence # CS-091843 (781) 726-3549
  // ENGINEER
  // Ryan Cleverdon Ryan S. Cleverdon, P.E. 29 Fisher Street Westborough MA 01581
  // Licence # 50306 (860) 841-0542
  // SURVEYOR
  // Steve Horsfall Kelly Engineering Group 0 Campanelli Drive Braintree MA 02184
  // Registration # 41608 (781) 843-4333
  // PERMIT FEE
  // $15,000`.trim();

  const secondHalfSections: { title: string; lines: string[] }[] = [];

  for (const line of secondHalfText.trim().split('\n')) {
    // console.log(line);
    if (isCapitalize(line) && line[0].match(/[A-Z]/)) {
      secondHalfSections.push({ title: line, lines: [] });
    } else {
      secondHalfSections[secondHalfSections.length - 1].lines.push(line);
    }
  }

  const [
    ownerSection,
    architectSection,
    contractorSection,
    engineerSection,
    surveyorSection,
    permitFeeSection,
  ] = secondHalfSections;

  // owner section

  const ownerSectionSplit = ownerSection.lines.join(' ').split(' ');
  const ownerSectionNumberIndex = ownerSectionSplit.findIndex((text) => text.match(/[0-9]/));
  object.owner = ownerSectionSplit.slice(0, ownerSectionNumberIndex).join(' ');
  object.ownerAddress = ownerSectionSplit.slice(ownerSectionNumberIndex).join(' ');

  // architect section
  if (architectSection.lines.length > 1) {
    const section = parseSection(architectSection);

    object.architect = section.name;
    object.architectAddress = section.address;
    object.architectRegistration = section.registration;
    object.architectPhone = section.phone;
  }

  // contractor section

  if (contractorSection.lines.length > 1) {
    const section = parseSection(contractorSection);

    object.contractor = section.name;
    object.contractorAddress = section.address;
    object.contractorRegistration = section.registration;
    object.contractorPhone = section.phone;
  }

  // engineer section

  if (engineerSection.lines.length > 1) {
    const section = parseSection(engineerSection);

    object.engineer = section.name;
    object.engineerAddress = section.address;
    object.engineerRegistration = section.registration;
    object.engineerPhone = section.phone;
  }

  // surveyor section

  if (surveyorSection.lines.length > 1) {
    const section = parseSection(surveyorSection);

    object.surveyor = section.name;
    object.surveyorAddress = section.address;
    object.surveyorRegistration = section.registration;
    object.surveyorPhone = section.phone;
  }

  // permit fee section
  object.permitFees = permitFeeSection.lines.join(' ');

  return object;
}

function parseSection({ title, lines }: { title: string; lines: string[] }) {
  // format:
  // [name]         [address]
  // [registration] [phone]

  // name line may be 2 lines
  let nameLine: string;
  let registrationLine: string;

  if (lines.length === 3) {
    nameLine = lines.slice(0, 2).join(' ');
    registrationLine = lines[2];
  } else {
    nameLine = lines[0];
    registrationLine = lines[1];
  }

  const nameLineSplit = nameLine.split(' ');
  // let firstNumberIndex: number;

  // // as the first line has the name and address, try to find
  // // the index of the address, which represents where to split.

  // // if the first letter is a number, then that means the
  // // name has a number
  // if (nameLine[0].match(/[0-9]/)) {
  // }

  const firstNumberIndex = nameLineSplit.findIndex((text) => text.match(/[0-9]/));
  const name = nameLineSplit.slice(0, firstNumberIndex).join(' ');
  const address = nameLineSplit.slice(firstNumberIndex).join(' ');

  const firstIndexOfOpenParenthesis = registrationLine.indexOf('(');
  const registration = registrationLine.slice(0, firstIndexOfOpenParenthesis).trim();
  const phone = registrationLine.slice(firstIndexOfOpenParenthesis).trim();

  return { name, address, registration, phone };
}

function isCapitalize(text: string) {
  return text === text.toUpperCase();
}

main();
