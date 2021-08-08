import { Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { BaseArguments } from '../types.js';

export const command = 'run-cronjobs';
export const description = 'Runs all cron