import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { compareStrings } from '@appsemble/utils';

/**
 * This script aims to help keep existing translations if a messages file has been moved.
 *
 * Running this script requires these replacements to have been implemented.
 *
 * The following example shows how to fix up messages if a messages file is renamed from
 * `packages/studio/src/components/AppContext/messages.ts` to
 * `packages/studio/src/pages/apps/app/messages.ts`.
 *
 * @example
 * ```ts
 * const replacements = [
 *   [/^studio\.src\.components\.AppContext\.(.*)/, 'studio.src.pages.apps.app.$1'],
 * ];
 * ```
 *
 * Now running the following command will fix the me