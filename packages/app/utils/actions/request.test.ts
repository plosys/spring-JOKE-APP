import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

let mock: MockAdapter;
let request: AxiosRequestConfig;

beforeEach(() => {
  mock = new MockAdapter(axios);
});

afterEach(() => {
  mock.restore();
});

describe('request', () => {
  it('should expose the HTTP method', () => {
    const action = createTestAction({
      definition: { type: 'request' },
    });
    expect(action.method).toBe('GET');
  });

  it('should expose the URL', () => {
    const action = createTestAction({
      