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
      definition: { type: 'request', url: 'https://example.com' },
    });
    expect(action.url).toBe('https://example.com');
  });

  it('should default to GET', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toStrictEqual({ data: '{"hello":"get"}' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support DELETE', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'delete' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'delete' });
    expect(request.method).toBe('delete');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toStrictEqual({ data: '{"hello":"delete"}' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support GET', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'get' },
      prefix: 'pages.0.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toStrictEqual({ data: '{"hello":"get"}' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support PATCH', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'patch' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'patch' });
    expect(request.method).toBe('patch');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"patch"}');
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support POST', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'post' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'post' });
    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"post"}');
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support PUT', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'put' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'put' });
    expect(request.method).toBe('put');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"put"}');
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support a body remapper', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    con