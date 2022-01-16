
import { LoginCodeResponse, OAuth2ClientCredentials } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';

import {
  App,
  AppOAuth2Secret,
  Member,
  OAuth2AuthorizationCode,
  Organization,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser, getTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;
let mock: MockAdapter;
let member: Member;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(() => {
  import.meta.jest.useFakeTimers({ now: 0 });
  mock = new MockAdapter(axios);
});

beforeEach(async () => {
  const user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  app = await App.create({
    OrganizationId: organization.id,
    vapidPublicKey: '',
    vapidPrivateKey: '',
    definition: {
      security: {
        default: {
          role: 'Test',
          policy: 'everyone',
        },
        roles: { Test: {} },
      },
    },
  });
  member = await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

describe('createAppOAuth2Secret', () => {
  it('should be possible to create an app secret', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "AppId": 1,
        "authorizationUrl": "https://example.com/oauth/authorize",
        "clientId": "example_client_id",
        "clientSecret": "example_client_secret",
        "created": "1970-01-01T00:00:00.000Z",
        "icon": "example",
        "id": 1,
        "name": "Example",
        "remapper": null,
        "scope": "email openid profile",
        "tokenUrl": "https://example.com/oauth/token",
        "updated": "1970-01-01T00:00:00.000Z",
        "userInfoUrl": "https://example.com/oauth/userinfo",
      }
    `);
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps/99999/secrets/oauth2', {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should require a login with Appsemble Studio', async () => {
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });
});

describe('getAppOAuth2Secrets', () => {
  it('should return OAuth2 secrets for an app', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.get<OAuth2ClientCredentials[]>(
      `/api/apps/${app.id}/secrets/oauth2`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "authorizationUrl": "https://example.com/oauth/authorize",
          "clientId": "example_client_id",
          "clientSecret": "example_client_secret",
          "created": "1970-01-01T00:00:00.000Z",
          "icon": "example",
          "id": 1,
          "name": "Example",
          "remapper": null,
          "scope": "email openid profile",
          "tokenUrl": "https://example.com/oauth/token",
          "updated": "1970-01-01T00:00:00.000Z",
          "userInfoUrl": "https://example.com/oauth/userinfo",
        },
      ]
    `);
    expect(response.data[0].id).toBe(secret.id);
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.get('/api/apps/99999/secrets/oauth2');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });
