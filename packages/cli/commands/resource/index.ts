import { Argv, CommandModule } from 'yargs';

import * as create from './create.js';
import * as update from './update.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'resource';
export const description = 'Commands related to resources.';

export function builder(yargs: Argv): Argv {
  return yargs
    .command(create as unknown as CommandModule)
    .command(update as unknown as CommandModule)
    .demandCommand(1);
}
