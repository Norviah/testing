import { Website } from './Website';

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '@/lib/logger';

import * as paths from '@/lib/paths';

export class Handler {
  /**
   * The base directory that contains all website modules.
   */
  private dir: string = paths.WEBSITES;

  /**
   * Whether if the handler has been initialized.
   */
  private isInitialized = false;

  /**
   * All initialized modules.
   */
  private websites: Website<string, string>[] = [];

  /**
   * Whether if the handler has been initialized.
   */
  public IsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Gets all website modules.
   *
   * @returns All website modules.
   */
  public GetModules(): Website<string, string>[] {
    return this.websites;
  }

  /**
   * Registers all website modules.
   *
   * @throws {Error} If a module does not export a valid class.
   */
  public RegisterAll(): void {
    const files = readdirSync(this.dir).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of files) {
      this.Register(file);
    }

    logger.success(`${this.websites.length} websites registered\n\n`);
  }

  /**
   * Registers a website module with the manager.
   *
   * @param file The path to the module to register.
   * @throws {Error} If the module does not export a valid class.
   */
  private Register(file: string): void {
    const data: unknown = require(join(paths.WEBSITES, file))?.default;

    if (!this.Validate(data)) {
      throw new Error(`File does not export a valid class: ${file}`);
    }

    const website = new data();

    if (!website.enabled) {
      return;
    }

    this.websites.push(website);
    logger.info(`registered ${website.GetName()}`);
  }

  /**
   * Determines whether if the provided variable is a valid `Website` subclass.
   *
   * @param object The object to check.
   * @returns Whether if the object is a valid `Website` subclass.
   * @example
   *
   * ```ts
   * const data = require(join(paths.WEBSITES, 'example.ts'))?.default;
   *
   * if (this.Validate(data)) {
   *   // in this scope, `data` is of the proper type
   * }
   * ```
   */
  private Validate(object: unknown): object is new (...args: ConstructorParameters<typeof Website>) => Website<string, string> {
    return typeof object === 'function' && object.prototype instanceof Website;
  }
}
