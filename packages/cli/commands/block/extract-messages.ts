import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { getBlockConfig, processBlockMessages } from '../../lib/block.js';
import { BaseArguments } from '../../types.js';

interface BuildBlockArguments extends BaseArguments {
  paths: string[];
  languages: string[];
}

export const co