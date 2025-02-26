import { Logger as BaseLogger } from '@norviah/logger';

import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DATE } from '@/lib/utils';

import type { LoggingOptions } from '@norviah/logger';

const hour = DATE.getHours();
export const TIMESTAMP = `${hour === 0 || hour === 12 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`;

export class Logger extends BaseLogger {
  /**
   * Initializes a new `Logger` instance.
   * @param options Default options to reference when logging.
   * @example
   * ```TypeScript
   * // Within the constructor for `Logger`, `Option` is used to set default
   * // options to reference when logging in addition to setting any desired
   * // functionality during logging.
   *
   * // As logging is split into three separate sections, through
   * // `Options.color`, you can specify the color to print each section as.
   * // All options are optional and any missing properties is filled in with
   * // default values.
   *
   * new Logger({ colors: { title: 'red', } });
   *
   * // With this example, anytime the `print` method is called and a `title` is
   * // specified, said title will have the color `red`, assuming that the color
   * // doesn't get overridden.
   *
   * // `options.color` represents default values to opt to when logging, as for
   * // properties representing functionality, we have `options.write`. If set
   * // to `true`, every time the `print` method is called, the log is
   * // also saved into a file.
   *
   * // You can go a bit further in where the file is saved to and as within
   * // `LoggingOptions`, or specifically, `WriteOptions`.
   *
   * new Logger({ write: true, });
   * ```
   */
  public constructor() {
    super({ write: true, dir: join('logs', `${DATE.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, TIMESTAMP) });
  }

  /**
   * Writes the given contents into a file.
   *
   * As `Logger` can optionally save logs into a file, determined by the `write`
   * property within `Options`, this method is called under the hood to save the
   * specified log into a file. Given the contents and options, the generated
   * log that would be printed, is rather saved into the specified file.
   *
   * As always, this method exists if you would like to save a log into a file,
   * regardless if the `write` property is set to true within the constructor.
   *
   * @param content The contents of the log.
   * @param options Options for logging.
   * @example
   *
   * ```TypeScript
   * import { Logger } from '@norviah/logger';
   *
   * // For this example, we'll initialize a new instance of `Logger` without
   * // providing any options. By default, any printed logs won't be saved into
   * // a file.
   *
   * const logger: Logger = new Logger();
   *
   * logger.print('world', { title: 'hello' });
   * // This would simply print out:
   * // [ 01-01-1970 12:00 AM ] hello: world
   *
   * // No logs are saved due to `write` being false.
   * // However, if `write` were to be set to `true`, it would save files by
   * // calling the `write` method under the hood.
   *
   * // This method is always available to you, allowing you to save logs into
   * // files regardless of what `write` was set to during the constructor.
   * // `write` accepts the same parameters as the `print` method, calling the
   * // same generator method but instead saving the log into a file.
   *
   * logger.write('world', { title: 'hello' });
   *
   * // By default, logs are saved into the `logs` subdirectory within your
   * // projects root directory under the file `MM-DD-YYYY.log`. If wanted, you
   * // can change the filename using the `name` property:
   *
   * logger.write('hello world', { name: 'hello world' });
   *
   * // This log would be saved under `logs/hello world.log`.
   * // There's other options available regarding writing logs within the
   * // `LoggingOptions` interface, as it inherits `WriteOptions`.
   * ```
   */
  public write(content: string | string[], options: Partial<LoggingOptions> = { colors: this.options.colors }): void {
    const log: string = `${this.generate(content, options)}\n`;

    // References the directory to save the log into.
    // If a subdirectory is given, we'll save into that instead.
    const dir: string = options.subDir ? join(this.options.dir, options.subDir) : this.options.dir;

    if (options.subDir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // The name of the file to save the log into.
    // If a name isn't specified, we'll opt to use the current date.
    const name: string = `${options.name ?? '_index'}.log`;

    appendFileSync(join(dir, name), log);

    // If a subdirectory was given, we'll check whether if the user wants to
    // save the log into the root directory as well.
    if ((options.subDir || options.name !== undefined) && (options.both ?? this.options.both)) {
      appendFileSync(join(this.options.dir, '_index.log'), log);
    }
  }

  /**
   * A helper method to print a success.
   * The title is set to `ok` with the color set to `green`.
   * @param content The content of the log.
   * @param options Options for logging.
   * @example
   * ```TypeScript
   * import { Logger } from '@norviah/logger';
   *
   * new Logger().success('sample text');
   * // => [ 01-01-1970 12:00 AM ] ok: sample text
   * ```
   */
  success(content: string | string[], options?: Partial<LoggingOptions>): void {
    this.print(content, { title: 'success', colors: { title: 'green', ...options?.colors }, ...options });
  }
}
