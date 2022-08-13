import {
  getAppBlocks,
  normalizeBlockName,
  parseBlockName,
  prefixBlockURL,
  stripBlockName,
} from './blockUtils.js';

describe('normalizeBlockName', () => {
  it('should prepend @appsemble if no organization is prepended', () => {
    const blockName = 'form';
    const result = normalizeBlockName(blockName);

    expect(result).toBe(`@appsemble/${blockName}`);
  });

  it('should leave block name intact if organization is prepended', () => {
    const blockName = '@example/test';
    const result = normalizeBlockName(blockName);

    expect(result).toBe(blockName);
  });
});

describe('stripBlockName', () => {
  it('should strip the @appsemble prefix from official blocks', () => {
    const result = stripBlockName('@appsemble/table');
    expect(result).toBe('table');
  });

  it('should keep other organization prefixes', () => {
    const result = stripBlockName('@other/table');
    expect(result).toBe('@other/table');
  });

  it('should support unprefixed block names', () => {
    const result = stripBlockName('table');
    expect(result).toBe('table');
  });
});

describe('parseBlockName', () => {
  it('should return a tuple of organization id and block id', () => {
    const result = parseBlockName('@example/test');
    expect(result).toStrictEqual(['example', 'test']);
  });

  it('should support numeric values', () => {
    const result = parseBlockName('@123-foo/456-bar');
    expect(result).toStrictEqual(['123-foo', '456-bar']);
  });

  it('should support official appsemble blocks', () => {
    const result = parseBlockName('detail-viewer');
    expect(result).toStrictEqual(['appsemble', 'detail-viewer']);
  });

  it('should return undefined for invalid values', () => {
    const result = parseBlockName('FooBar');
    expect(result).toBeUndefined();
  });
});

describe('getAppBlocks', () => {
  it('should find unique block types inside an app', () => {
    const result = getAppBlocks({
      name: '',
      defaultPage: '',
      pages: [
        {