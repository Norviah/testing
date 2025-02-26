/**
 * The current date.
 */
export const DATE = new Date();

/**
 * Checks if the given value is a string.
 *
 * @param value The value to check.
 * @returns Whether if the value is a string.
 * @example
 *
 * ```ts
 * const array: any[] = [1, 2, "hi", 3];
 *
 * const filteredArray: string[] = array.filter(IsString);
 * // => ["hi"]
 * ```
 */
export function IsString(value: unknown): value is string {
  return typeof value === 'string';
}
