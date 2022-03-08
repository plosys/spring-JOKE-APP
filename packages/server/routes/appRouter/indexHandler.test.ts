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

  const [a00, a01, b00, b02, a10, a11, b10, b12] = await BlockVersion.bulkCreate([
    { name: 'a', OrganizationId: 'test', version: '0.0.0' },
    { name: 'a', OrganizationId: 'test', version: '0.0.1' },
    { name: 'b', OrganizationId: 'test', version: '0.0.0' },
    { name: 'b', OrganizationId: 'test', version: '0.0.2' },
    { name: 'a', OrganizationId: 'appsemble', version: '0.1.0' },
    { name: 'a', OrganizationId: 'appsemble', version: '0.1.1' },
    { name: 'b', OrganizationId: 'appsemble', version: '0.1.0' },
    { name: 'b', OrganizationId: 'appsemble', version: '0.1.2' },
  ]);
  await BlockAsset.bulkCreate([
    {
      OrganizationId: 'test',
      BlockVersionId: a00.id,
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a00.id,
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a01.id,
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a01.id,
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b00.id,
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b00.id,
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b02.id,
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b02.id,
      filename: 'b2.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a10.id,
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a10.id,
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a11.id,
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a11.id,
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b10.id,
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b10.id,
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b12.id,
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b12.id,
      filename: 'b2.css',
      content: Buffer.from(''),
    },
  ]);
  setArgv({ host: 'http://host.example', secret: 'test' });
  const server = await createServer({
    middleware(ctx, next) {
      Object.defineProperty(ctx, 'origin', { get: () => requestURL.origin });
      Object.defineProperty(ctx, 'hostname', { get: () => requestURL.hostname });
      return next();
    },
  });
  await setTestApp(server);
});

beforeEach(() => {
  import.meta.jest.useFakeTimers({ now: 0 });
  requestURL = new URL('http://app.test.host.example');
});

it('should render the index page', async () => {
  await App.create({
    OrganizationId: 'test',
    definition: {
      name: 'Test App',
      pages: [
        {
          name: 'Test Page',
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          name: 'Test Page with Flow',
          type: 'flow',
          steps: [
            {
              blocks: [
                { type: 'a', version: '0.1.0' },
                {
                  type: 'a',
                  version: '0.1.1',
                  actions: { whatever: { blocks: [{ type: '@test/b', version: '0.0.2' }] } },
                },
              ],
            },
          ],
        },
      ],
    },
    path: 'app',
    vapidPublicKey: '',
    vapidPrivateKey: '',
  });
  const response = await request.get('/');
  expect(response).toMatchInlineSnapshot(`
    HTTP/1.1 200 OK
    Content-Security-Policy: connect-src * blob: data:; default-src 'self'; font-src * data:; frame-src 'self' *.vimeo.com *.youtube.com; img-src * blob: data: http://host.example; media-src * blob: data: http://host.example; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-ZIQmAQ5kLTM8k