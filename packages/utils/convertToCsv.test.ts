import { convertToCsv } from './convertToCsv.js';

describe('convertToCsv', () => {
  it('should throw an error if input is null', () => {
    const input: any = null;

    expect(() => convertToCsv(input as any)).toThrow(new Error('No data'));
  });

  it('should return an error if the input has no keys', () => {
    const input = {};

    expect(() => convertToCsv(input)).toThrow(new Error('No headers could be found'));
  });

  it('should return an error if the input is a primitive', () => {
    const input = 'foo';

    expect(() => convertToCsv(input as any)).toThrow(new TypeError('Data is of an invalid type'));
  });

  it('should correctly combines all headers', () => {
    const input = [
      { foo: 123, baz: 1 },
      { foo: 123, bar: 'bar' },
    ];
    const output = 'bar,baz,foo\r\n,1,123\r\nbar