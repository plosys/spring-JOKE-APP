import { basicAuth } from '@appsemble/node-utils';
import { TokenResponse } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import jwt from 'jsonwebtoken';

import { App, OAuth2AuthorizationCode, OAuth2ClientCredentials, User } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createJWTResponse } from '../../utils/createJWTResponse.js';
import { createServer } from '../../utils/createServer.js';
import { createTestUser } from '../../utils/test/authorization.js';
import { useTestDatabase } from '../../utils/test/testSchema.js';

let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  import.meta.jest.useFakeTimers({ now: new Date('2000-01-01T00:00:00Z') });
  user = await createTestUser();
});

it('should not accept invalid content types', async () => {
  const response = await request.post('/oauth2/token', {});
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'invalid_request',
    },
  });
});

it('should not accept missing grant types', async () => {
  const response = await request.post('/oauth2/token', '');
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'unsupported_grant_type',
    },
  });
});

it('should not accept unsupported grant types', async () => {
  const response = await request.post('/oauth2/token', 'grant_type=unsupported');
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'unsupported_grant_type',
    },
  });
});

describe('authorization_code', () => {
  it('should handle a missing referer header', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'app:123',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost',
        scope: 'openid',
      }),
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_request',
      },
    });
  });

  it('should fail if the referer doesn’t match the redirect URI', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'app:42',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      }),
      { headers: { referer: 'http://fooz.baz.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_request',
      },
    });
  });

  it('should fail if the client id doesn’t match an app id', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'invalid',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should fail if no authorization code has been registered', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'app:42',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should not allow expired authorization codes', async () => {
    await user.$create('Organization', { id: 'org' });
    const app = await App.create({
      OrganizationId: 'org',
      definition: '',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const expires = new Date('1999-12-31T23:00:00Z');
    const authCode = await OAuth2AuthorizationCode.create({
      AppId: app.id,
      code: '123',
      UserId: user.id,
      expires,
      redirectUri: 'http://foo.bar.localhost:9999/',
      scope: 'openid',
    });
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: `app:${app.id}`,
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_grant',
      },
    });
    await expect(authCode.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should only allow granted scopes', async () => {
    await user.$create('Organization', { id: 'org' });
    const app = await App.create({
      OrganizationId: 'org',
      definition: '',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const expires = new Date('2000-01-01T00:10:00Z');
    await OAuth2AuthorizationCode.create({
      AppId: app.id,
      code: '123',
      UserId: user.id,
      expires,
      redirectUri: 'http://foo.bar.localhost:9999/',
      scope: 'openid',
    });
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: `app:${app.id}`,
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http:/