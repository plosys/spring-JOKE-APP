import { request, setTestApp } from 'axios-test-instance';

import { setArgv } from '../index.js';
import { AppMessages } from '../models/index.js';
import { createServer } from '../utils/createServer.js';

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('getAppsembleLanguages', () => {
  it('should return the list of languages appsemble supports', async () => {
    const result = await request('/api/messages');
    expect(result).toMatchObject({ status: 200, data: expect.arrayContaining(['en', 'nl']) });
  });
});

describe('getStudioMessages', () => {
  it('should return all translations for a language', async () => {
    const result = await request.get<AppMessages>('/api/messages/nl');
    const keys = Object.keys(result.data.messages);
    expect(result).toMatchObject({ status: 200, data: { language: 'nl' } });
    expect(
      keys.every((key) => key.startsWith('studio') || key.startsWith('react-components')),
    ).toBe(true);
  });

  it('should filter based on the context given', async () => {
    const resultStudio = await request.get<AppMessages>('/api/messages/nl');
    expect(
      Object.keys(resultStudio.data.messages).every(
        (key) => key.startsWith('studio') || key.startsWith('react-components'),
      ),
    ).toBe(true);
  });

  it('should return empty messages if requesting the default language', async () => {
    const result = await request('/api/messages/en');
    expect(resul