import { client } from '@/utils/client';

import type { Board, Column, Group } from '@mondaydotcomorg/api';
import type * as Puppeteer from 'puppeteer';

export async function waitForDownload(page: Puppeteer.Page): Promise<void> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    page._client().on('Page.downloadProgress', (e) => {
      if (e.state === 'completed') {
        resolve();
      } else if (e.state === 'canceled') {
        reject();
      }
    });
  });
}

export const isWithinAmountOfDays = (today: Date, dateString: Date, days: number) => {
  const date = new Date(dateString);
  const differenceInTime = today.getTime() - date.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  return differenceInDays < days;
};

export async function meta(
  keys: string[],
  boardId: string,
): Promise<{
  ids: string[];
  columnIds: Record<string, string>;
  columns: Column[] | undefined;
  groups: Group[] | undefined;
}> {
  const query = `query { 
    boards(ids: ${boardId}) { 
      name 
    	id
          groups {
      title
      id
    }
      items_page (limit: 500) {
        items {
          id
          name
          column_values {
            id
            text
            type
            value
          }
        }
      }
    	columns {
      	id
        title
    	}
    }
  }`;

  const { boards } = await client.query<{
    boards: [Board];
    columns: [Column];
  }>(query);

  const board = boards[0];
  const ids = board.items_page.items.map((x) => x.name);

  // console.log(board.columns);

  const keysToId = [
    ...(board.columns?.map((x) => x!.title).filter((x) => x !== 'Name' && x !== 'Subitems') || []),
  ].reduce(
    (acc, key) => {
      const column = board.columns!.find(
        (column) => column!.title.toLowerCase() === key.toLowerCase(),
      );
      if (column) {
        acc[key] = column.id;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    ids,
    columnIds: keysToId,
    columns: board.columns as Column[] | undefined,
    groups: board.groups as Group[] | undefined,
  };
}
