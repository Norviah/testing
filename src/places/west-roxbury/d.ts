import { prisma } from "@/utils/db";
import { readFileSync } from "node:fs";

import * as paths from "@/utils/paths";

import type { WestRoxbury } from "@prisma/client";

async function main(): Promise<void> {
	const text = readFileSync(paths.WEST_ROXBURY_DATA, "utf-8").split("\n");
	const keys = text.splice(0, 1)[0].split(",");
	const object = text.map((line) => {
		const values = line.split(",");
		const obj = {} as Record<string, string | Date | undefined>;
		keys.forEach((key, index) => {
			if (key.toLowerCase().includes("date") && values[index]) {
				obj[key] = new Date(values[index]);
			} else {
				obj[key] = values[index];
			}
		});
		return obj;
	});

	await prisma.westRoxbury.createMany({
		data: object as WestRoxbury[],
	});
}

main();
