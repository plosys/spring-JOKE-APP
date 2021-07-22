import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

describe('email', () => {
  let mock: MockAdapter;
  let request: AxiosRequestConfig;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onPost(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`).reply((req) => {
      request = req;
      return [200, {}];
    });
  });

  afterEa