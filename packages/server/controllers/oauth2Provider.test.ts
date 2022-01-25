import { LoginCodeResponse, UserInfo } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';

import {
  App,
  AppMember,
  Member,
  OAuth2AuthorizationCode,
  Organization,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeApp, authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

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

describe('getUserInfo', () => {
  it('should return userinfo formatted as defined by OpenID', async () => {
    authorizeStudio();
    const response = await request.get('/api/connect/userinfo');
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
        picture: 'https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp',
        sub: user.id,
      },
    });
  });

  it('should work if the user has no primary email address', async () => {
    await user.update({ primaryEmail: null });
    authorizeStudio();
    const response = await request.get('/api/connect/userinfo');
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: null,
        email_verified: false,
        name: 'Test User',
        sub: user.id,
      },
    });
  });

  it('should return 403 forbidden if the user isn’t an app member', async () => {
    await Organization.create({ id: 'test-organization' });
    const app = await App.create({
      definition: {},
      OrganizationId: 'test-organization',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    authorizeApp(app);
    const response = await request.get<UserInfo>('/api/connect/userinfo');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "Forbidden",
        "statusCode": 403,
      }
    `);
  });

  it('should use app member information when an app requests the info', async () => {
    await Organization.create({ id: 'test-organization' });
    const app = await App.create({
      definition: {},
      OrganizationId: 'test-organization',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'test',
      email: 'test@example.com',
      emailVerified: true,
      name: 'Test User',
      picture: Buffer.from('PNG'),
    });
    authorizeApp(app);
    const response = await request.get<UserInfo>('/api/connect/userinfo');
    expect(response).toMatchInlineSnapshot(
      { data: { sub: expect.stringMatching(uuid4Pattern), picture: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "email": "test@example.com",
        "email_verified": true,
        "name": "Test User",
        "picture": Any<String>,
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
      }
    `,
    );
    expect(response.data.sub).toBe(user.