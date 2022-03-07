// eslint-disable-next-line unicorn/import-style
import crypto from 'node:crypto';

import { request, setTestApp } from 'axios-test-instance';

import { App, BlockAsset, BlockVersion, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';
import { useTestDatabase } from '../../utils/test/testSchema.js';

let requestURL: URL;

useTestDatabase(import.meta);

beforeEach(() => {
  import.meta.jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => Buffer.alloc(size));
});

beforeEach(async () => {
  await Organization.create({ id: 'test' });
  await Organization.create({ id: 'appsemble' });

  const [a00, a01, b00, b02, a1