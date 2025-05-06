import { config } from '@/utils/config';

import type { meta } from '@/utils/helpers';
import type { Agent, MondayEntry } from '@prisma/client';
import type { keys } from '../keys';

export async function updateAgent(
  agent: Agent,
  entry: MondayEntry,
  metaInfo: Awaited<ReturnType<typeof meta>>,
  specificKey: (typeof keys)[number],
  specificValue: string | undefined,
): Promise<void> {
  try {
    //   change_column_value (
    // board_id: ${entry.boardId}
    // group_id: "${entry.groupId}"
    // item_id: "${entry.itemId}"
    // column_values: "${JSON.stringify(newObject).replace(/"/g, '\\"')}"
    const query = `mutation  {
        change_simple_column_value  (
          board_id: ${entry.boardId}
          item_id: "${entry.itemId}"
          column_id: "${metaInfo.columnIds[specificKey]}"
          value: "${specificValue}"
        ) {
          id
          column_values {
            id
            text
            value
          }
        }
      }
      `;
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
    if (response.error_message) {
      // console.log(response);
      // console.log(query);
      throw new Error(response);
    }

    // // console.log(`updated ${agent.name}: ${specificKey} to ${specificValue}`);
  } catch (e) {
    console.error(`error updating agent ${agent.name}`);
    console.error(e);
    // console.log((e as Error).message);
    throw e;
  }
}
