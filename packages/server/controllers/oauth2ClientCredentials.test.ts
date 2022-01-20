
import { OAuth2ClientCredentials as OAuth2ClientCredentialsType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';

import { OAuth2ClientCredentials, User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
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