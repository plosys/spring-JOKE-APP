import { extractAppMessages, findMessageIds } from './appMessages.js';

describe('findMessageIds', () => {
  it('should ignore null', () => {
    const result = findMessageIds(null);
    expect(result).toStrictEqual({});
  });

  it('should ignore non-object values', () => {
    const result = findMessageIds('A string');
    expect(result).toStrictEqual({});
  });

  it('should find message ids from a string.format remapper', () => {
    const result = findMessageIds({ 'string.format': { messageId: 'foo' } });
    expect(result).toStrictEqual({ foo: '' });
  });

  it('should return the message template', () => {
    const result = findMessageIds({ 'string.format': { messageId: 'foo', template: 'bar' } });
    expect(result).toStrictEqual({ foo: 'bar' });
  });

  it('should ignore non-string message ids', () => {
    const result = findMessageIds({ 'string.format': { messageId: 12 } });
    expect(result).toStrictEqual({});
  });

  it('should missing message ids', () => {
    const result = findMessageIds({ 'string.format': {} });
    expect(result).toStrictEqual({});
  });

  it('should recurse into arrays', () => {
    const result = findMessageIds([
      { 'string.format': { messageId: 'foo' } },
      { 'string.format': { messageId: 'bar' } },
    ]);
    expect(result).toStrictEqual({ foo: '', bar: '' });
  });

  it('should recurse into objects', () => {
    const result = findMessageIds({
      foo: { 'string.format': { messageId: 'fooz' } },
      bar: { 'string.format': { messageId: 'baz' } },
    });
    expect(result).toStrictEqual({ fooz: '', baz: '' });
  });

  it('should extract string.format remapper values', () => {
    const result = findMessageIds({
      'string.format': { messageId: 'foo', values: { translate: 'bar' } },
    });
    expect(result).toStrictEqual({ foo: '', bar: '' });
  });
});

describe('extractAppMessages', () => {
  it('should extract page prefixes', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        { name: 'First Page', blocks: [] },
        { name: 'Second Page', blocks: [] },
      ],
    });
    expect(result).toMatchObject({
      app: { 'pages.first-page': 'First Page', 'pages.second-page': 'Second Page' },
    });
  });

  it('should extract block header remappers', () => {
    const result = extractAppMessages({
      defaultPage: '',
      pages: [
        {
          name: 'Page',
          blocks: [
            { type: 'test', version: '1.2.3', header: { 'string.format': { messageId: 'foo' } } },
          ],
        },
      ],
    });
    expect(result).toMatchObject({ messageIds: { foo: '' }, app: { 'pages.page