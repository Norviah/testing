import { existsSync, mkdirSync, readFileSync, rm, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { Jimp, type RGBAColor, intToRGBA } from 'jimp';

import { join } from 'node:path';
import * as paths from '@/utils/paths';
import { createWorker } from 'tesseract.js';

// const util = require('node:util');
// const

import { exec as rawExec } from 'node:child_process';
import util from 'node:util';

const exec = util.promisify(rawExec);

function colorIs(color: RGBAColor, target: number) {
  return color.r === target && color.g === target && color.b === target;
}

export async function parse() {
  // const script = `${paths.PYTHON_ACTIVATION_SOURCE} && python ${paths.PYTHON_SCRIPT} ${paths.STOUGHTON_PDF} ${paths.STOUGHTON_COMBINED_PICTURE}`;
  // const s = await exec(script);

  // if (s.stderr) {
  //   throw new Error(s.stderr);
  // }

  const imageBuffer = readFileSync(paths.STOUGHTON_COMBINED_PICTURE);
  const image = await Jimp.read(imageBuffer);
  const worker = await createWorker();

  const height = image.bitmap.height;
  const width = image.bitmap.width;
  let textArray: string[] = [];

  let started = false;

  const white = 255;
  const grey = 244;
  let currentCOlor: typeof white | typeof grey | undefined;

  const sections: { from: number; to: number }[] = [];
  let lastY: number | undefined;
  let num = 0;

  if (existsSync(paths.STOUGHTON_PICTURES)) {
    rmSync(paths.STOUGHTON_PICTURES, { recursive: true });
  }

  mkdirSync(paths.STOUGHTON_PICTURES, { recursive: true });

  for (let y = 0; y < height; y++) {
    const color = intToRGBA(image.getPixelColor(41, y));

    if (!started) {
      if (colorIs(color, white) || colorIs(color, grey)) {
        started = true;
        lastY = y;
      }

      continue;
    }

    if (currentCOlor === undefined) {
      currentCOlor = color.r === white ? white : grey;
      lastY = y;
    }

    const indexColor = color.r === white ? white : color.r === grey ? grey : undefined;

    if (indexColor && currentCOlor !== indexColor) {
      // sections.push({ from: lastY!, to: y });

      // const sectionImage = image.clone().crop({
      //   x: 0,
      //   y: section.from,
      //   w: width,
      //   h: section.to - section.from,
      // });

      const section = image.clone().crop({
        x: 0,
        y: lastY!,
        w: width,
        h: y - lastY!,
      });

      // const imgPath = join(paths.STOUGHTON_PICTURES, `${num}.png`);
      // num++;
      // await section.write(imgPath as `${string}.${string}`);

      currentCOlor = indexColor;
      lastY = y;

      const {
        data: { text: rawText },
      } = await worker.recognize(await section.getBuffer('image/jpeg'));

      const tex = rawText.trim().split('\n');

      // text.push(rawText.trim());
      textArray = textArray.concat(tex);
    }

    if (y === height - 1) {
      // sections.push({ from: lastY!, to: y });
      const section = image.clone().crop({
        x: 0,
        y: lastY!,
        w: width,
        h: y - lastY!,
      });

      // const imgPath = join(paths.STOUGHTON_PICTURES, `${num}.png`);
      // num++;
      // await section.write(imgPath as `${string}.${string}`);

      const {
        data: { text: rawText },
      } = await worker.recognize(await section.getBuffer('image/jpeg'));

      const tex = rawText.trim().split('\n');

      // text.push(rawText.trim());
      textArray = textArray.concat(tex);
    }
  }

  // worker.terminate();
  // console.log(text);
  const ftextArray = textArray.filter((text) => {
    if (text === '') {
      return false;
    }

    // if (text.toLowerCase().startsWith('permit cat')) {
    //   return false;
    // }

    // // check if string has these matches:
    // // day, day, \d
    // // page[optional space]\d+of[optional space]\d+

    // if (
    //   text.toLowerCase().match(/page[ \d]+of[ \d]+/) ||
    //   text.toLowerCase().match(/[a-z]+, [a-z]+ \d+, \d{4}/i)
    // ) {
    //   return false;
    // }

    return true;
  });

  console.log(textArray);
  worker.terminate();
  writeFileSync(join(paths.DATA, 'text.json'), JSON.stringify(ftextArray, null, 2));
  writeFileSync(join(paths.DATA, 'text raw.json'), JSON.stringify(textArray, null, 2));
}

parse();
