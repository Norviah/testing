import { client } from '@/utils/client';
import type { Board } from '@mondaydotcomorg/api';

export async function createBoard(boardNumber: number): Promise<string> {
  const query = `
    mutation {
      create_board (board_name: "Agents ${boardNumber} ", board_kind: private, folder_id: 13381147, board_owner_ids: [58415039]) {
        id
      }
    }
  `;

  const r = (await client.query<{
    boards: [Board];
  }>(query)) as unknown as { create_board: { id: string } };

  return r.create_board.id;
}

// allen: 23328368
// 23328368

// 62465198
