
import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';

import { EmailAuthorization, ResetPasswordToken, User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('registerEmail', () => {
  it('should register valid email addresses', async () => {
    const data = { email: 'test@example.com', password: 'password', timezone: 'Europe/Amsterdam' };
    const response = await request.post('/api/email', data);

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const email = await EmailAuthorization.findByPk('test@example.com');
    const user = await User.findByPk(email.UserId);

    expect(user.password).not.toBe('password');
    expect(await compare(data.password, user.password)).toBe(true);
  });