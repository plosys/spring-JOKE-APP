import { Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import pkg from '../package.json' assert { type: 'json' };
import { BaseArguments } from '../types.js';

export const command = 'migrate [migrate-to]';
export const description = 'Migrate the Appsemble database';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('migrate-to', {
      desc: 'The database versio