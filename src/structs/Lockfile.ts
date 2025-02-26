import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import * as paths from '@/lib/paths';
import * as Lockfile from '@/schemas/Lockfile';

export class LockfileManager {
  /**
   *
   */
  public constructor() {
    this.Create();
  }

  /**
   *
   */
  public Create(force = false): void {
    if (force || !existsSync(paths.LOCKFILE)) {
      this.Set(Lockfile.State.Standby);
    }
  }

  /**
   *
   * @param state
   */
  public Set(state: Lockfile.State): void {
    writeFileSync(paths.LOCKFILE, `${JSON.stringify({ state } as Lockfile.Structure)}`);
  }

  /**
   *
   * @returns
   */
  public GetState(): Lockfile.State {
    const data = readFileSync(paths.LOCKFILE, 'utf-8');

    try {
      return Lockfile.Structure.parse(JSON.parse(data)).state;
    } catch {
      this.Create(true);
      return Lockfile.State.Standby;
    }
  }
}
