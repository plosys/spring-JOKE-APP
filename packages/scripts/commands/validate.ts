import { existsSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { getWorkspaces, logger, opendirSafe, readData } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import fsExtra from 'fs-extra';
import normalizePath from 'normalize-path';
import semver from 'semver';
import { PackageJson } from 'type-fest';

import { extractMessages } from '../lib/i18n.js';

export const command = 'validate';
export const description = 'Validate all workspaces have a proper configuration';

/**
 * A list of packages that are released without a scoped package name.
 */
const unscopedPackageNames = new Set(['appsemble', 'create-appsemble']);

/**
 * A representation of a yarn workspace.
 */
interface Workspace {
  /**
   * The absolute path to the workspace directory.
   */
  dir: string;

  /**
   * The contents of the package.json file in the workspace.
   */
  pkg: PackageJson;
}

/**
 * A validation result
 */
interface Result {
  /**
   * The filename to which the result applies.
   */
  filename: string;

  /**
   * The validation message.
   */
  message: string;

  /**
   * Checked on truthiness to see if the result is a pass or fail.
   */
  pass: any;

  /**
   * The workspace on which the result applies.
   */
  workspace: Workspace;
}

/**
 * Assert if a check fails or passes.
 *
 * @param assertion Whether the assertion passed.
 * @param filename On which file name the assertion applies.
 * @param message A description of the assertion that was run.
 */
type Assert = (assertion: boolean, filename: string, message: string, workspace?: string) => void;

async function validateTranslations(assert: Assert): Promise<void> {
  const developerLocales = [default