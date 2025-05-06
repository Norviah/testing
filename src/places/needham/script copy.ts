// const { Jimp, intToRGBA, crop: jimpCrop } = require('jimp');
// const fs = require('node:fs');
// const path = require('node:path');
// const { PDFDocument } = require('pdf-lib');
// const { pdf } = require('pdf-to-img');

import fs from 'node:fs';
import path from 'node:path';

import { Jimp, intToRGBA } from 'jimp';
import { PDFDocument } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import { findLongestStreakOfBlackColor } from './utils';

// import PDF file
const pdfPath = path.join(__dirname, 'data.pdf');
const parsedPath = path.join(__dirname, 'parsed.pdf');

// const pdf = scissors(pdfPath)
//   .pages(1)
//   .pdfStream()
//   .pipe(fs.createWriteStream(path.join(__dirname, 'parsed.pdf')))
//   .on('finish', () => {
//     // console.log('PDF file saved');
//   })
//   .on('error', (error) => {
//     console.error(error);
//   })

async function crop() {
  // Read the PDF as a Uint8Array
  const pdfBytes = fs.readFileSync(pdfPath);

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const parsedPdf = await PDFDocument.create();

  // Copy the first page from the source PDF to the new PDF
  const [firstPage] = await parsedPdf.copyPages(pdfDoc, [0]);

  // Define the cropping box (x, y, width, height)
  // Example: crop the page from (50, 50) to (400, 600)
  // firstPage.setCropBox(0, 0, firstPage.getWidth(), firstPage.getHeight() / 2);

  // // console.log(firstPage.getHeight());

  firstPage.setCropBox(0, 0, firstPage.getWidth(), 305.25);
  // firstPage.setCropBox(firstPage.getHeight(), 0, firstPage.getWidth(), firstPage.getHeight() / 2);

  // Add the copied page to the new PDF
  parsedPdf.addPage(firstPage);

  // Save the new PDF
  const newPdfBytes = await parsedPdf.save();

  // Write the new PDF to a file
  fs.writeFileSync(parsedPath, newPdfBytes);
}

// async function lines(pageImage: Awaited<ReturnType<typeof Jimp.read>>, counter: number) {
async function lines(buffer: Buffer, counter: number) {
  // // Load the PDF document
  // // const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
  // // const parsedPdf = await PDFDocument.create();
  // // const firstPage = pdfDoc.getPages()[0];

  // const pageImag = await Jimp.read(path.join(__dirname, 'image.png'));

  // pageImage.crop({
  //   x: 0,
  //   y: 0,
  //   w: pageImage.bitmap.width,
  //   h: 407,

  //   // x: 0,
  //   // y: 407,
  //   // w: pageImage.bitmap.width,
  //   // h: pageImage.bitmap.height - 407
  // });
  // // pageImage.crop(0, 0, pageImage.bitmap.width, 305.25);

  const firstPageImage = await Jimp.read(buffer);
  const secondPageImage = await Jimp.read(buffer);

  const height = firstPageImage.bitmap.height;
  const width = firstPageImage.bitmap.width;

  const record = {};

  for (let y = 0; y < height; y++) {
    const colors: { r: number; g: number; b: number }[] = [];

    for (let x = 0; x < width; x++) {
      colors.push(intToRGBA(firstPageImage.getPixelColor(x, y)));
    }

    const longestStreak = findLongestStreakOfBlackColor(colors, 10, '<');

    if (longestStreak.longestStreak > 0) {
      record[y] = longestStreak;
    }
  }

  // get the first Y coordinate with > 1000 streak
  let firstY = 0;

  for (const key in record) {
    if (record[key].longestStreak > 1000) {
      firstY = Number.parseInt(key);
      break;
    }
  }

  // // console.log(firstY);

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

  // // // console.log(record);
  // fs.writeFileSync(path.join(__dirname, 'record.json'), JSON.stringify(record, null, 1));
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  // let highestStreak = 0;

  // for (const key in record) {
  //   const streak = record[key].longestStreak;

  //   if (streak > highestStreak) {
  //     highestStreak = streak;
  //   }
  // }

  // return highestStreak;
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
