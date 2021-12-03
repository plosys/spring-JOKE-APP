import { Argv } from 'yargs';

import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { cleanupDNS } from '../utils/dns/index.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { databaseBuilder } from './builder/database.js';

export const command = 'cleanup';
export const description = 'Restore the app DNS settings from the database in the host platform';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('app-domain-strategy', {
      desc: 'How to link app domain names to apps',
      choices: ['kubernetes-ingress'],
    })
    .option('ingress-class-name', {
      desc: 'The class name of the ingresses to create.',
      default: 'nginx',
    })
    .option('ingress-annotations', {
      desc: 'A JSON string representing ingress annotations to add to created ingresses.',
      implies: ['service-name', 'service-port'],
    })
    .option('service-name', {
      desc: 'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-port'],
    })
    .option('service-port', {
      desc: 'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-name'],
    })
    .option('host', {
      desc