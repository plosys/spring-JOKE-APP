import { readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { boomMiddleware } from '../../middleware/boom.js';
import { BlockAsset, BlockVersion, Organization } from '../../models/index.js';
import { useTestDatabase } from '../../utils/test/testSchema.js';
import { appRouter } from './index.js';

useTestDatabase(import.meta);

beforeAll(async () => {
  await setTestApp(new Koa().use(boomMiddleware()).use(appRouter));
});

it('should download a block asset', async () => {
  await Organization.create({ id: 'linux', name: 'Linux' });
  const { id } = await BlockVersion.create({
    OrganizationId: 'linux',
    version: '3.1.4',
    name: 'tux',
  });
  await BlockAsset.create({
    filename: 'tux.png',
    content: await readFixture('tux.png'),
    mime: 'image/png',
    BlockVersionId: id,
  });
  const response = await request.get('/api/blocks/@linux/tux/versions/3.1.4/tux.png', {
    responseType: 'arraybuffer',
  });
  expect(response.status).toBe(200);
  expect(response.headers[