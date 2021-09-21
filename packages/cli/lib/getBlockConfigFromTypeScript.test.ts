import { readdirSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { AppsembleError, resolveFixture } from '@appsemble/node-utils';
import { ts } from 'ts-json-schema-generator';

import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript.js';

beforeEach(() => {
  import.meta.jest.spyOn(process, 'cwd').mockReturnValue(resolveFixture('.'));
});

describe('getBlockConfigFromTypeScript', () => {
  it('should extract configuration from a TypeScript project', () => {
    const result = getBlockConfigFromTypeScript({
      name: '',
      layout: 'float',
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: resolveFixture('getBlockConfigFromTypeScript/valid'),
    });
    expect(result).toStrictEqual({
      actions: { testAction: { description: undefined } },
      events: {
        emit: { testEmit: { description: undefined } },
        listen: { testListener: { description: undefined } },
      },
      messages: undefined,
      parameters: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        additionalProperties: false,
        properties: {
          param1: { type: 'string' },
          param2: { type: 'number' },
          param3: { type: 'boolean' },
          param4: { type: 'string' },
          param5: {
            additionalProperties: false,
            properties: {
              nested1: { type: 'string' },
              nested2: { type: 'number' },
              nested3: { type: 'boolean' },
            },
            required: ['nested1', 'nested2', 'nested3'],
            type: 'object',
          },
          param6: { items: { type: 'string' }, type: 'array' },
        },
        required: ['param1', 'param2', 'param3', 'param5', 'param6'],
        type: 'object',
      },
    });
  });

  it('should not use TypeScript if all metadata is present in the original config', () => {
    import.meta.jest.spyOn(ts, 'createProgram');
    const input = {
      actions: {},
      events: { emit: { foo: {} }, listen: { bar: {} } },
      layout: 'float',
      parameters: { type: 'object' },
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: resolveFixture('getBlockConfigFromTypeScript/valid'),
      name: '',
    } as const;
    const result = getBlockConfigFromTypeScript(input);

    expect(result).toBe(input);
    expect(ts.createProgram).not.toHaveBeenCalled();
  });

  it('should prefer actions overrides over TypeScript actions', () => {
    const result = getBlockConfigFromTypeScript({
      actions: {},
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: resolveFixture('getBlockConfigFromTypeScript/valid'),
      name: '',
    });

    expect(result.actions).toStrictEqual({});
  });

  it('should prefer events overrides over TypeScript events', () => {
    const result = getBlockConfigFromTypeScript({
      events: { emit: { onSuccess: {} } },
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: resolveFixture('getBlockConfigFromTypeScript/valid'),
      name: '',
    });

    expect(result.events).toStrictEqual({ emit: { onSuccess: {} } });
  });

  it('should prefer parameters overrides over TypeScript parameters', () => {
    const result = getBlockConfigFromTypeScript({
      parameters: { type: 'object' },
      version: '1.33.7',
      webpack: '',
      output: '',
      dir: resolveFixture('getBlockConfigFromTypeScript/valid'),
      name: '',
    });

    expect(result.parameters).toStrictEqual({ type: 'object' });
  });

  it('should throw if duplicate Actions are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        webpack: '',
        output: '',
        dir: resolveFixture('getBlockConfigFromTypeScript/duplicateActions'),
        name: '',
        version: '1.33.7',
      }),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'Actions' in 'getBlockConfigFromTypeScript/duplicateActions/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate EventEmitters are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        webpack: '',
        output: '',
        dir: resolveFixture('getBlockConfigFromTypeScript/duplicateEventEmitters'),
        name: '',
        version: '1.33.7',
      }),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'EventEmitters' in 'getBlockConfigFromTypeScript/duplicateEventEmitters/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate EventListeners are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        webpack: '',
        output: '',
        dir: resolveFixture('getBlockConfigFromTypeScript/duplicateEventListeners'),
        name: '',
        version: '1.33.7',
      }),
    ).toThrow(
      new AppsembleError(
        "Found duplicate interface 'EventListeners' in 'getBlockConfigFromTypeScript/duplicateEventListeners/index.ts:31'",
      ),
    );
  });

  it('should throw if duplicate Parameters are found', () => {
    expect(() =>
      getBlockConfigFromTypeScript({
        web