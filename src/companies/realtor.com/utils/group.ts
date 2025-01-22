import { config } from '@/utils/config';
import { meta } from '@/utils/helpers';

import { client } from '@/utils/client';
import type { Board as BaseBoard, Group as BaseGroup } from '@mondaydotcomorg/api';

export type Group = BaseGroup & {
  count: number;
  names: string[];
};

export type Board = BaseBoard & {
  groups: (Group & { count: number })[];
};

export async function getBoard(
  BOARD_ID: string,
  // ): Promise<Board & { groups: (Group & { count: number })[] }> {
): Promise<Board> {
  const query = `
    query {
      boards(ids: ${BOARD_ID}) {
        id
        name
        board_folder_id 
        groups {
          id
          title
        }
      }
    }
  `;

  const { boards } = await client.query<{
    boards: [BaseBoard];
  }>(query);

  const groups: Group[] = [];

  for (const group of boards[0].groups ?? []) {
    const query = `
      query {
        boards(ids: ${BOARD_ID}) {
          groups(ids: "${group!.id}") {
            id
            title
            items_page(limit: 500) {
              cursor
              items {
                id
                name
              }
            }
          }
        }
      }
    `;

    const { boards } = await client.query<{
      boards: [BaseBoard];
    }>(query);

    const g = boards[0].groups![0]!;
    let count = g.items_page.items.length;
    let names: string[] = g.items_page.items.map((item) => item.name);

    if (count === 500) {
      const query = `
        query {
          next_items_page(limit: 500, cursor: "${g.items_page.cursor}") {
            cursor
            items {
              id
              name
            }
          }
        }
      `;

      const { next_items_page } = await client.query<{
        next_items_page: {
          cursor: string;
          items: {
            id: string;
            name: string;
          }[];
        };
      }>(query);

      count += next_items_page.items.length;
      names = [...names, ...next_items_page.items.map((item) => item.name)];
    }

    groups.push({ ...g, count, names });
    // groups.push({ ...boards[0], groups: { ...g, count } });
  }

  return { ...boards[0], groups };
}

export async function ensureGroup(
  keys: string[],
  BOARD_ID: string,
  metaInfo: Awaited<ReturnType<typeof meta>>,
  name: string,
): Promise<ReturnType<typeof meta>> {
  if (!metaInfo.groups?.some((group) => group.title === name)) {
    const query = `mutation {
  create_group (board_id: ${BOARD_ID}, group_name: "${name}", position_relative_method: before_at) {
    id
  }
}`;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: query,
      }),
    }).then((res) => res.json());
    console.log(`Created group: ${name} with id: ${response.data.create_group.id}`);
    console.log(response);
    return await meta(keys, BOARD_ID);
  }

  return metaInfo;
}
