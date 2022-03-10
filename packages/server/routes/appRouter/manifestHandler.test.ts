import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { App, AppScreenshot, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { useTestDatabase } from '../../utils/test/testSchema.js';
import { appRouter } from './index.js';

useTestDatabase(import.meta);

beforeAll(async () => {
  const app = new Koa();
  app.use((ctx, next) => {
    Object.defineProperty(ctx, 'origin', { value: 'http://test-app.manitest.localhost:9999' });
    return next();
  });
  app.use(appRouter);
  await setTestApp(app);
  setArgv({
    host: 'http://localhost:9999',
  });
});

it('should serve a PWA manifest', async () => {
  await Organization.create({ id: 'manitest' });
  await App.create({
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      theme: { splashColor: '#deffde', themeColor: '#fa86ff' },
    },
    OrganizationId: 'manitest',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  const response = await request.get('/manifest.json');
  expect(response).toMatchObject({
    status: 200,
    headers: expect.objectContaining({
      'content-type': 'application/manifest+json; charset=utf-8',
    }),
    data: {
      background_color: '#deffde',
      display: 'standalone',
      icons: [
        {
          purpose: 'any',
          sizes: '48x48',
          src: '/icon-48.png',
          type: 'image/png',
        },
        {
