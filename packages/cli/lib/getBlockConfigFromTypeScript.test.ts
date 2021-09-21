import { readdirSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { AppsembleError, resolveFixture } from '@appsemble/node-utils';
import { ts } from 'ts-json-schema-generator';

import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript.js';

beforeEach(() => {
  import.meta.jest.spyOn(process, 'cwd').mockReturnValue(resolveFixture('.'));
});

describe('getBlockConfigFromTypeScript', () => {
  it('should extract configuration from a TypeScript project', () => {
    const result = getBlockConfigFromTypeScript({
      name: '',
      layout: 'float',
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: resolveFixture('getBlockConfigFromType