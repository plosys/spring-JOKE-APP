import { createFixtureStream, createFormData } from '@appsemble/node-utils';
import { Asset as AssetType } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';

import { App, Asset, Member, Organization, Resource, User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let user: User;
let app: App;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });

  app = await App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      security: {
        default: {
          role: 'Reader',
          policy: 'everyone',
        },
        roles: {
          Reader: {},
        },
      },
    },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: organization.id,
  });
});

describe('getAssets', () => {
  it('should return an empty array if no assets exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });

  it('should fetch all of the app’s assets', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: {},
    });

    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
      name: 'a',
    });

    const assetB = await Asset.create({
      AppId: app.id,
      ResourceId: resource.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get<AssetType[]>(`/api/apps/${app.id}/assets`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "name": "a",
        },
        {
          "filename": "foo.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "resourceId": 1,
          "resourceType": "testResource",
        },
      ]
    `,
    );
    expect(response.data[0].id).toBe(assetA.id);
    expect(response.data[1].id).toBe(assetB.id);
  });

  it('should not fetch another app’s assets', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    const appB = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app-B',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get<AssetType[]>(`/api/apps/${app.id}/assets`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "foo.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
    expect(response.data[0].id).toBe(assetA.id);
    expect(response.data[1].id).toBe(assetB.id);
  });
});

describe('countAssets', () => {
  it('should return 0 if no assets exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should return the number of assets', async () => {
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should not count another app’s assets', async () => {
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    const appB = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        