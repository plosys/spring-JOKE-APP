import { Dirent, Stats } from 'node:fs';
import { mkdir, opendir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

import { compareStrings } from '@appsemble/utils';
import parseJson from 'parse-json';
import sortKeys from 'sort-keys';
import { Promisable } from 'type-fest';
import { parse, stringify } from 'yaml';

import { AppsembleError } from './index.js';

/**
 * Test if the error is a NodeJS errno exception.
 *
 * @param error The value to check
 * @param code If specified, check if the code matches
 * @returns Whether or not the error is a NodeJS errno exception.
 */
export function isErrno(error: unknown, code?: string): error is NodeJS.ErrnoException {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as NodeJS.ErrnoException;
  if (code) {
    return err.code === code;
  }
  return typeof err.code === 'string';
}

/**
 * Read the content of a JSON or YAML file.
 *
 * @param path The path to the file to read.
 * @returns A tuple of the parsed content and the content as a string.
 */
export async function readData<R>(path: URL | string): Promise<[R, string]> {
  let content: string;
  const ext = extname(String(path));
  try {
    content = await readFile(path, 'utf8');
  } catch {
    throw new AppsembleError(`Error reading file ${path}`);
  }
  if (ext !== '.yaml' && ext !== '.yml' && ext !== '.json') {
    throw new AppsembleError(`Unknown file extension: ${path}`);
  }
  try {
    return [
      ext === '.json' ? parseJson(content) : (parse(content, { maxAliasCount: 10_000 }) as R),
      content,
    ];
  } catch (error: unknown) {
    throw new AppsembleError(`Error parsing ${path}\n${(error as Error).message}`);
  }
}

interface WriteDataOptions {
  /**
   * If false, don’t sort the object keys.
   */
  readonly sort?: boolean;

  /**
   * A comparison function to use for sorting keys.
   *
   * By default natural sorting will be used.
   */
  readonly compare?: ((a: string, b: string) => number) | null;
}

/**
 * Write data to a file serialized as JSON or YAML.
 *
 * If `prettier` is available, the content is also formatted.
 *
 * @param path The file path to write the data to.
 * @param data The data to write to the file.
 * @param options Additional options for processing the data.
 * @returns The formatted content.
 */
export async function writeData(
  path: string,
  data: unknown,
  { compare = compareStrings, sort = true }: WriteDataOptions = {},
): Promise<string> {
  const sorted = sort ? sortKeys(data, { deep: true, compare: compare || undefined }) : data;
  let buffer: string;
  try {
    const { default: prettier 