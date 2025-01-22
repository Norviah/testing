import { config } from '@/utils/config';
import { meta } from '@/utils/helpers';

import type { Column } from '@mondaydotcomorg/api';

export async function ensureKeys(
  keys: string[],
  BOARD_ID: string,
): Promise<ReturnType<typeof meta>> {
  let metaInfo = await meta(keys, BOARD_ID);
  let changed = false;

  for (const key of keys) {
    if (key.toLowerCase() === 'name') {
      continue;
    }

    if (!metaInfo.columns?.some((col: Column) => col.title === key)) {
      changed = true;
      const query = `mutation{
    create_column(board_id: ${BOARD_ID}, title:"${key}", column_type:text) {
      id
      title
      description
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
      console.log(`Created column: ${key} with id: ${response.data.create_column.id}`);
      console.log(response);
    }
  }

  if (changed) {
    metaInfo = await meta(keys, BOARD_ID);
  }

  return metaInfo;
}
