import { readFileSync, writeFileSync } from 'node:fs';
import { Jimp, intToRGBA } from 'jimp';
import { createWorker } from 'tesseract.js';

import { join } from 'node:path';
import { SavedPermitDataStructure } from '@/types';
import * as paths from '@/utils/paths';

const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

function isCapitalize(text: string) {
  return text && text.length > 0 && text === text.toUpperCase();
}

async function main() {
  const worker = await createWorker();
  const imageBuffer = readFileSync(paths.NEEDHAM_COMBINED_PICTURE);
  const image = await Jimp.read(imageBuffer);
  const data: SavedPermitDataStructure<'Needham', 'MA'>[] = [];

  const height = image.bitmap.height;
  const width = image.bitmap.width;

  const sectionYs: number[] = [];

  const x = 740;

  for (let y = 0; y < height; y += 1) {
    const rgb = { ...intToRGBA(image.getPixelColor(x, y)), x, y };
    const white = rgb.r === 255 && rgb.g === 255 && rgb.b === 255;

    if (!white) {
      sectionYs.push(y);
    }
  }

  const sections = sectionYs
    .reduce(reducer, [] as { from: number; to: number }[])
    .filter((section) => {
      return section.to - section.from > 100;
    });

  for (const [i, section] of sections.entries()) {
    const HARD_CODED_SECTION_X_COORDS = 873;

    const sectionImage = image.clone().crop({
      x: 0,
      y: section.from,
      w: width,
      h: section.to - section.from,
    });

    const sectionFirstHalf = sectionImage.clone().crop({
      x: 0,
      y: 0,
      w: HARD_CODED_SECTION_X_COORDS,
      h: sectionImage.bitmap.height,
    });

    const sectionSecondHalf = sectionImage.clone().crop({
      x: HARD_CODED_SECTION_X_COORDS,
      y: 0,
      w: sectionImage.bitmap.width - HARD_CODED_SECTION_X_COORDS,
      h: sectionImage.bitmap.height,
    });

    const rootImage = `${join(paths.NEEDHAM_PICTURES, String(i))}.png` as const;
    const firstHalfImage = `${join(paths.NEEDHAM_PICTURES, String(i))}-first-half.png` as const;
    const secondHalfImage = `${join(paths.NEEDHAM_PICTURES, String(i))}-second-half.png` as const;

    await sectionImage.write(rootImage);
    await sectionFirstHalf.write(firstHalfImage);
    await sectionSecondHalf.write(secondHalfImage);

    const {
      data: { text: firstHalfText },
    } = await worker.recognize(firstHalfImage);

    const {
      data: { text: secondHalfText },
    } = await worker.recognize(secondHalfImage);

    const obj = getObject(firstHalfText, secondHalfText);
    data.push(obj);
    // console.log(`Finished section ${i + 1} of ${sections.length}`);
  }

  worker.terminate();
  writeFileSync(paths.NEEDHAM_DATA, JSON.stringify(data, null, 2));
}

function reducer(acc: { from: number; to: number }[], y: number) {
  const last = acc[acc.length - 1];

  if (last) {
    acc.push({ from: last.to, to: y });

    return acc;
  }

  return [{ from: 0, to: y }];
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

  // // console.log(firstHalfText);
  // // console.log('---');
  // // console.log(descriptionString);

  let totalFees: string;

  try {
    totalFees = descriptionString.match(/\$[0-9,]+/g)![0];
  } catch {
    descriptionString = descriptionString.replace(/ESTIMATED COST/gi, '');

    totalFees = descriptionString.match(/\$?[0-9,]{1,}/g)!.at(-1)!;
  }

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

  // // console.log(secondHalfText);
  // // console.log('-');

  for (const line of secondHalfText.trim().split('\n')) {
    if (line === '') {
      continue;
    }

    // // console.log('---');
    // // console.log(line);
    // // console.log('---');

    // const title = titleButHasTwoLowercaseLettersInFrontForSomeReason(line);

    let title: string;
    const [letters, ...rawTitle] = line.split(' ');

    if (letters.length === 2 && letters === letters.toLowerCase()) {
      title = rawTitle.join(' ');
    } else {
      title = line;
    }

    if (isCapitalize(title) && title[0].match(/[A-Z]/)) {
      secondHalfSections.push({ title: title, lines: [] });
    } else {
      secondHalfSections[secondHalfSections.length - 1].lines.push(title);
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

    let ownerSectionSplit = line.trim().split(' ');
    if (email) {
      ownerSectionSplit = ownerSectionSplit.reverse();
    }

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
    permit.architect_address = section.address;
    permit.architect_registration = section.registration;
    permit.architect_phone = section.phone;
  }

  // contractor section

  if (contractorSection.lines.length > 1) {
    const section = parseSection(contractorSection);

    permit.contractor = section.name;
    permit.contractor_address = section.address;
    permit.contractor_licence = section.registration;
    permit.contractor_phone = section.phone;
  }

  // engineer section

  if (engineerSection.lines.length > 1) {
    const section = parseSection(engineerSection);

    permit.engineer = section.name;
    permit.engineer_address = section.address;
    permit.engineer_licence = section.registration;
    permit.engineer_phone = section.phone;
  }

  // surveyor section

  if (surveyorSection.lines.length > 1) {
    const section = parseSection(surveyorSection);

    permit.surveyor = section.name;
    permit.surveyor_address = section.address;
    permit.surveyor_registration = section.registration;
    permit.surveyor_phone = section.phone;
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

main();
