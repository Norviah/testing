// const { Jimp, intToRGBA, crop: jimpCrop } = require('jimp');
// const fs = require('node:fs');
// const path = require('node:path');
// const { PDFDocument } = require('pdf-lib');
// const { pdf } = require('pdf-to-img');

import fs, { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { Jimp, intToRGBA } from 'jimp';
import { PDFDocument } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import { findLongestStreakOfBlackColor } from './utils';

import type { SavedPermitDataStructure } from '@/types';
import * as paths from '@/utils/paths';

// import PDF file

const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

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

  const ROOT_PICTURE_DIR = path.join(paths.NEEDHAM, 'pictures', counter.toString());

  const FIRST_IMAGE_DIR = path.join(ROOT_PICTURE_DIR, 'first');
  const FIRST_IMAGE_FULL = path.join(FIRST_IMAGE_DIR, 'full.png');
  const FIRST_IMAGE_FIRST_HALF = path.join(FIRST_IMAGE_DIR, 'left.png');
  const FIRST_IMAGE_SECOND_HALF = path.join(FIRST_IMAGE_DIR, 'right.png');

  const SECOND_IMAGE_DIR = path.join(ROOT_PICTURE_DIR, 'second');
  const SECOND_IMAGE_FULL = path.join(SECOND_IMAGE_DIR, 'full.png');
  const SECOND_IMAGE_FIRST_HALF = path.join(SECOND_IMAGE_DIR, 'left.png');
  const SECOND_IMAGE_SECOND_HALF = path.join(SECOND_IMAGE_DIR, 'right.png');

  mkdirSync(ROOT_PICTURE_DIR, { recursive: true });
  mkdirSync(FIRST_IMAGE_DIR, { recursive: true });
  mkdirSync(SECOND_IMAGE_DIR, { recursive: true });

  await pageImage.write(path.join(ROOT_PICTURE_DIR, 'full.png') as `${string}.${string}`);

  await firstPermit.write(FIRST_IMAGE_FULL as `${string}.${string}`);
  await firstPermitFirstHalf.write(FIRST_IMAGE_FIRST_HALF as `${string}.${string}`);
  await firstPermitSecondHalf.write(FIRST_IMAGE_SECOND_HALF as `${string}.${string}`);

  await secondPermit.write(SECOND_IMAGE_FULL as `${string}.${string}`);
  await secondPermitFirstHalf.write(SECOND_IMAGE_FIRST_HALF as `${string}.${string}`);
  await secondPermitSecondHalf.write(SECOND_IMAGE_SECOND_HALF as `${string}.${string}`);

  //

  const worker = await createWorker();

  const {
    data: { text: firstPermitFirstHalfText },
  } = await worker.recognize(FIRST_IMAGE_FIRST_HALF);
  const {
    data: { text: firstPermitSecondHalfText },
  } = await worker.recognize(FIRST_IMAGE_SECOND_HALF);

  const {
    data: { text: secondPermitFirstHalfText },
  } = await worker.recognize(SECOND_IMAGE_FIRST_HALF);
  const {
    data: { text: secondPermitSecondHalfText },
  } = await worker.recognize(SECOND_IMAGE_SECOND_HALF);

  await worker.terminate();

  // console.log(text, text2);
  const firstPermitObject = getObject(firstPermitFirstHalfText, firstPermitSecondHalfText);
  const secondPermitObject = getObject(secondPermitFirstHalfText, secondPermitSecondHalfText);

  console.log('---');
  console.log(firstPermitFirstHalfText);
  console.log();
  console.log(firstPermitSecondHalfText);
  console.log('---');
  console.log(secondPermitFirstHalfText);
  console.log('-');
  console.log(secondPermitSecondHalfText);

  return [firstPermitObject, secondPermitObject];
}

export async function parse() {
  if (!existsSync(paths.NEEDHAM)) {
    mkdirSync(paths.NEEDHAM, { recursive: true });
  }

  if (!existsSync(paths.NEEDHAM_PICTURES)) {
    mkdirSync(paths.NEEDHAM_PICTURES, { recursive: true });
  }

  // if (existsSync(paths.NEEDHAM_PICTURES)) {
  //   fs.rmdirSync(paths.NEEDHAM_PICTURES, { recursive: true });
  // }

  // mkdirSync(paths.NEEDHAM_PICTURES, { recursive: true });

  const { pdf } = await import('pdf-to-img');
  const data: SavedPermitDataStructure<'Needham', 'MA'>[] = [];

  let counter = 1;
  const document = await pdf(paths.NEEDHAM_PDF, { scale: 3 });

  for await (const image of document) {
    if (counter === 83) {
      const o = await lines(image, counter);

      console.log(`Page ${counter} done`);

      data.push(...o);
    }

    counter++;
  }

  writeFileSync(paths.NEEDHAM_DATA, JSON.stringify(data, null, 1));

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

  const permit: SavedPermitDataStructure<'Needham', 'MA'> = {
    city: 'Needham',
    state: 'MA',
    permitnumber,
    issued_date: date,
    status,
    mbl,
    permittypedescr: permitType,
    zone: zoning,
    address,
    description: descriptionString,
    total_fees: totalFees,
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

  if (ownerSection.lines.length > 0) {
    let line = ownerSection.lines.join(' ');

    const email = line.match(emailRegex);
    if (email) {
      line = line.replace(email[0], '');
      permit.owner_email_address = email[0];
    }

    const ownerSectionSplit = line.split(' ');

    // const ownerSectionSplit = ownerSection.lines.join(' ').split(' ');
    // const ownerSectionNumberIndex = ownerSectionSplit.findIndex((text) => text.match(/[0-9]/));

    let ownerSectionNumberIndex: number | undefined;

    for (let i = 0; i < ownerSectionSplit.length; i++) {
      const match = ownerSectionSplit[i].match(/[0-9]/);

      if (match && i !== 0) {
        ownerSectionNumberIndex = i;
        break;
      }
    }

    if (ownerSectionNumberIndex === undefined) {
      console.log(secondHalfText);
      throw new Error('Owner section number index not found');
    }

    permit.owner = ownerSectionSplit.slice(0, ownerSectionNumberIndex).join(' ');
    permit.address = ownerSectionSplit.slice(ownerSectionNumberIndex).join(' ');
  }

  // const ownerSectionObject = parseSection(ownerSection);
  // object.owner = ownerSectionObject.name;
  // object.ownerAddress = ownerSectionObject.address;

  // architect section
  if (architectSection.lines.length > 1) {
    const section = parseSection(architectSection);

    permit.architect = section.name;
    permit.architectAddress = section.address;
    permit.architectRegistration = section.registration;
    permit.architectPhone = section.phone;
  }

  // contractor section

  if (contractorSection.lines.length > 1) {
    const section = parseSection(contractorSection);

    permit.contractor = section.name;
    permit.contractorAddress = section.address;
    permit.contractorLicence = section.registration;
    permit.contractorPhone = section.phone;
  }

  // engineer section

  if (engineerSection.lines.length > 1) {
    const section = parseSection(engineerSection);

    permit.engineer = section.name;
    permit.engineerAddress = section.address;
    permit.engineerLicence = section.registration;
    permit.engineerPhone = section.phone;
  }

  // surveyor section

  if (surveyorSection.lines.length > 1) {
    const section = parseSection(surveyorSection);

    permit.surveyor = section.name;
    permit.surveyorAddress = section.address;
    permit.surveyorRegistration = section.registration;
    permit.surveyorPhone = section.phone;
  }

  return permit;
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
