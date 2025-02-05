import { ensureGroup, getBoard } from '@/companies/legacy/utils/group';
import { config } from '@/utils/config';
import { prisma } from '@/utils/db';
import { meta } from '@/utils/helpers';

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureKeys } from '@/companies/legacy/utils/ensureKeys';
import type { SavedPermitDataStructure, SavedPermitDataStructureWithDate } from '@/types';
import { client } from '@/utils/client';
import { logger } from '@/utils/logger';
import * as paths from '@/utils/paths';
import { Group } from '@mondaydotcomorg/api';
import type { City, Permit } from '@prisma/client';
import { pushPermit } from './pushPermit';

const MAIN_FOLDER_ID = '15054091';
const SECONDARY_FOLDER_ID = '15054099';

type Board = {
  name: string;
  id: string;
  groupId?: string;
  type: 'Demo' | 'Building';
  folder: string;
};

let boards: Board[];

if (existsSync(paths.BOARDS)) {
  boards = JSON.parse(readFileSync(paths.BOARDS, 'utf-8'));
} else {
  writeFileSync(paths.BOARDS, '[]');
  boards = [];
}

export async function push(file: string) {
  const raw = JSON.parse(readFileSync(file, 'utf-8')) as SavedPermitDataStructure<string, string>[];

  const data: SavedPermitDataStructureWithDate<string, string>[] = raw
    .map((permit) => {
      const { issued_date, expiration_date, applied_date, finalized_date, ...rest } = permit;

      return {
        issued_date: issued_date ? new Date(issued_date) : null,
        expiration_date: expiration_date ? new Date(expiration_date) : null,
        applied_date: applied_date ? new Date(applied_date) : null,
        finalized_date: finalized_date ? new Date(finalized_date) : null,
        ...rest,
      };
    })
    .sort((a, b) => {
      if (!a.issued_date || !b.issued_date) {
        return 0;
      }

      return b.issued_date.getTime() - a.issued_date.getTime();
    });

  const cities: Record<string, SavedPermitDataStructureWithDate<string, string>[]> = {};

  for (const permit of data) {
    if (!cities[permit.city]) {
      cities[permit.city] = [];
    }

    cities[permit.city].push(permit);
  }

  for (const city in cities) {
    await pushCity(cities[city]);
  }
}

async function pushCity(raw: SavedPermitDataStructureWithDate<string, string>[]) {
  const state = await prisma.state.upsert({
    where: {
      name: raw[0].state,
    },

    update: {},

    create: {
      name: raw[0].state,
    },
  });

  const city = await prisma.city.upsert({
    where: {
      name_stateId: {
        name: raw[0].city,
        stateId: state!.id,
      },
    },
    update: {},
    create: {
      name: raw[0].city,
      stateId: state!.id,
    },
    include: {
      permits: true,
    },
  });

  if (!city) {
    throw new Error('City not found');
  }

  const demoPermits: SavedPermitDataStructureWithDate<string, string>[] = [];
  const buildingPermits: SavedPermitDataStructureWithDate<string, string>[] = [];

  for (const permit of raw) {
    const isDemo =
      permit.isDemo === true ||
      permit.description?.toLowerCase().includes('demo') ||
      permit.comments?.toLowerCase().includes('demo') ||
      permit.worktype?.toLowerCase().includes('demo') ||
      permit.permittypedescr?.toLowerCase().includes('demo');

    if (isDemo) {
      demoPermits.push(permit);
    } else {
      buildingPermits.push(permit);
    }
  }

  const r = await pushFolder(city, demoPermits, buildingPermits, MAIN_FOLDER_ID, true);
  // await pushFolder(city, demoPermits, buildingPermits, SECONDARY_FOLDER_ID, false);
  await pushFolder(city, r.demo, r.building, SECONDARY_FOLDER_ID, false);
}

async function pushFolder(
  city: City & { permits: Permit[] },
  demoPermits: SavedPermitDataStructureWithDate<string, string>[],
  buildingPermits: SavedPermitDataStructureWithDate<string, string>[],
  FOLDER_ID: string,
  createPrisma: boolean,
) {
  const pushedDemoPermits = await pushPermits(city, demoPermits, 'Demo', FOLDER_ID, createPrisma);
  const pushedBuildingPermits = await pushPermits(city, buildingPermits, 'Building', FOLDER_ID, createPrisma);

  return {
    demo: pushedDemoPermits,
    building: pushedBuildingPermits,
  };
}

async function pushPermits(
  city: City & { permits: Permit[] },
  permits: SavedPermitDataStructureWithDate<string, string>[],
  type: 'Demo' | 'Building',
  FOLDER_ID: string,
  createPrisma: boolean,
): Promise<SavedPermitDataStructureWithDate<string, string>[]> {
  const pushedIds: SavedPermitDataStructureWithDate<string, string>[] = [];
  let boardReference = boards.find((b) => b.name === city.name && b.type === type && b.folder === FOLDER_ID);
  let created = false;
  const BOARD_ID = boardReference ? boardReference.id : await createBoard(`${city.name} ${type} Permits`, FOLDER_ID);

  if (!boardReference) {
    boardReference = { name: city.name, id: BOARD_ID, type, folder: FOLDER_ID };
    created = true;
  }

  let board = await getBoard(BOARD_ID);
  await ensureKeys(keys, BOARD_ID);
  let metaInfo = await meta([], BOARD_ID);

  type Grou = Awaited<ReturnType<typeof getBoard>>['groups'][0];

  let buildingPermitGroup: Grou | undefined;
  const restGroups: Grou[] = [];

  for (const group of board.groups) {
    if (boardReference.groupId) {
      if (group.id === boardReference.groupId) {
        buildingPermitGroup = group;
      } else if (group.title.toLowerCase() === `${type} Permits`.toLowerCase()) {
        buildingPermitGroup = group;
      } else {
        restGroups.push(group);
      }
    }
  }

  if (!buildingPermitGroup) {
    metaInfo = await ensureGroup([], BOARD_ID, metaInfo, `${type} Permits`);
    board = await getBoard(BOARD_ID);
    buildingPermitGroup = board.groups.find((g) => g.title.toLowerCase() === `${type} Permits`.toLowerCase());
    boardReference.groupId = buildingPermitGroup!.id;
  }

  if (created) {
    const newTemplateGroup = board.groups.filter((g) => g.title.toLowerCase() === 'group title');

    if (newTemplateGroup.length) {
      for (const group of newTemplateGroup) {
        await deleteBoard(BOARD_ID, group.id);
      }
    }
  }

  if (created || !buildingPermitGroup) {
    boards.push(boardReference);
    writeFileSync(paths.BOARDS, JSON.stringify(boards, null, 2));
  }

  if (!buildingPermitGroup) {
    throw new Error('Group not found');
  }

  for (const permit of permits) {
    await pushPermit({
      BOARD_ID,
      group: buildingPermitGroup,
      permit,
      metaInfo,
      keys,
      city,
      pushedIds,
      createPrisma,
      restGroups: restGroups,
    });
  }

  logger.info(`pushed ${pushedIds.length} permits to ${city.name} (${type} - ${FOLDER_ID})`);
  return pushedIds;
}

const keys = [
  'worktype',
  'permittypedescr',
  'description',
  'comments',
  'applicant',
  'declared_valuation',
  'total_fees',
  'issued_date',
  'expiration_date',
  'status',
  'owner',
  'occupancytype',
  'sq_feet',
  'address',
  'city',
  'state',
  'zip',
  'property_id',
  'parcel_id',
  'gpsy',
  'gpsx',
  'y_latitude',
  'x_longitude',
  'applicant_business',
  'applicant_address',
  'applicant_home_number',
  'applicant_work_number',
  'applicant_mobile_number',
  'applicant_email_address',
  'licensed_professional_name',
  'licensed_professional_business',
  'licensed_professional_address',
  'licensed_professional_not_sure',
  'estimated_cost_of_construction',
  'owner_company',
  'applied_date',
  'finalized_date',
  'owner_phone_number',
  'zone',
  'applicant_city',
  'applicant_state',
  'applicant_zip',
  'mbl',
  'amount',
  'owner_email_address',
  'architect',
  'architect_address',
  'architect_registration',
  'architect_phone',
  'contractor',
  'contractor_address',
  'contractor_licence',
  'contractor_phone',
  'engineer',
  'engineer_address',
  'engineer_licence',
  'engineer_phone',
  'surveyor',
  'surveyor_address',
  'surveyor_registration',
  'surveyor_phone',
];

async function createBoard(name: string, FOLDER_ID: string): Promise<string> {
  const query = `
    mutation {
      create_board (board_name: "${name}", board_kind: private, folder_id: ${FOLDER_ID}, board_owner_ids: [61305113,58415039,23328368,62465198,52821049,47468980,65233535]) {
        id
      }
    }
  `;

  const r = (await client.query<{
    boards: [Board];
  }>(query)) as unknown as { create_board: { id: string } };

  return r.create_board.id;
}

async function deleteBoard(boardId: string, groupId: string) {
  const query = `
    mutation {
      delete_group (board_id: ${boardId}, group_id: "${groupId}") {
        id
        deleted
      }
    }
  `;

  const r = (await client.query(query)) as unknown as { create_board: { id: string } };

  return r;
}

async function t() {
  // const d = await getBoard('7355753313');
  // console.log(d);
  const dirName = 'woburn';

  logger.info(`pushing ${dirName}`);
  await push(join(paths.PERMITS, dirName, 'data.json'));
}
