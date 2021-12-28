import { createFixtureStream } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';

import {
  App,
  AppMessages,
  BlockMessages,
  BlockVersion,
  Member,
  Organization,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { getAppsembleMessages } from '../utils/getAppsembleMessages.js';
import {
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;
let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'AppEditor' });
  app = await App.create({
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: 'testorganization',
    definition: {
      name: 'Test App',
      description: 'Description',
      pages: [],
    },
  });
});

describe('getMessages', () => {
  it('should return the messages for an existing language', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-gb',
      messages: { messageIds: { test: 'Test.' } },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en-GB`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en-gb",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {
            "test": "Test.",
          },
        },
      }
    `,
    );
  });

  it('should return a 404 if a language is not supported', async () => {
    const response = await request.get(`/api/apps/${app.id}/messages/en-GB`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Language “en-GB” could not be found",
        "statusCode": 404,
      }
    `);
  });

  it('should return a 200 if a language is not supported, but is the default language', async () => {
    await app.update({
      definition: {
        ...app.definition,
        defaultLanguage: 'nl-nl',
      },
    });
    const response = await request.get(`/api/apps/${app.id}/messages/nl-nl`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "nl-nl",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {},
        },
      }
    `,
    );
  });

  it('should return a 200 if a en is not supported and is default language unset', async () => {
    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {},
        },
      }
    `,
    );
  });

  it('should merge messages with the base language if merge is enabled', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { messageIds: { test: 'Test.', bla: 'bla' } },
    });

    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-gb',
      messages: { messageIds: { bla: 'blah' } },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en-GB?merge=true`);

    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en-gb",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {
            "bla": "blah",
            "test": "Test.",
          },
        },
      }
    `,
    );
  });

  it('should include translated block messages', async () => {
    authorizeStudio();
    await Organization.create({
      id: 'appsemble',
      name: 'Appsemble',
    });
    const blockA = await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.0',
    });
    const blockB = await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.1',
    });
    const blockC = await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'form',
      version: '0.0.0',
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'en',
      messages: { foo: 'bar', bla: 'bla' },
    });
    await BlockMessages.create({
      BlockVersionId: blockB.id,
      language: 'en',
      messages: { foo: 'bar', test: 'test', bla: 'blablabla' },
    });
    await BlockMessages.create({
      BlockVersionId: blockC.id,
      language: 'en',
      messages: { form: 'form' },
    });
    await app.update({
      definition: {
        name: 'Test App',
        description: 'Description',
        pages: [
          {
            name: 'test',
            blocks: [
              { type: '@testorganization/test', version: '0.0.0' },
              { type: '@testorganization/test', version: '0.0.1' },
              { type: 'form', version: '0.0.0' },
            ],
          },
        ],
      },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
            "pages.test": "test",
          },
          "blocks": {
            "@appsemble/form": {
              "0.0.0": {
                "form": "form",
              },
            },
            "@testorganization/test": {
              "0.0.0": {
                "bla": "bla",
                "foo": "bar",
              },
              "0.0.1": {
                "bla": "blablabla",
                "foo": "bar",
                "test": "test",
              },
            },
          },
          "core": Any<Object>,
          "messageIds": {},
        },
      }
    `,
    );
  });

  it('should merge translations if other language’s translations are incomplete', async () => {
    authorizeStudio();
    const blockA = await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.0',
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'en',
      messages: { foo: 'bar', bla: 'bla' },
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'nl',
      messages: { foo: 'foo but dutch', bla: '' },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl',
      messages: { messageIds: { test: 'test translation' } },
    });
    await app.update({
      definition: {
        name: 'Test App',
        description: 'Description',
        pages: [
          {
            name: 'test',
            blocks: [{ type: '@testorganization/test', version: '0.0.0' }],
          },
        ],
      },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/nl`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "nl",
        "messages": {
          "app": {
            "description": "Description",
            "