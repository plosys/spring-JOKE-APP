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

it('should not accept missing grant ty