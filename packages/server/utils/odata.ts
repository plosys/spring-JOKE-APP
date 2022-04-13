import { has } from '@appsemble/utils';
import { defaultParser, Token, TokenType } from '@odata/parser';
import { col, fn, json, Model, Op, Order, where, WhereOptions, WhereValue } from 'sequelize';
import { Col, Fn, Json, Where } from 'sequelize/types/utils';

type PartialModel = Pick<typeof Model, 'tableName'>;

enum Edm {
  null = 'null',
  Boolean = 'Edm.Boolean',
  Byte = 'Edm.Byte',
  Date = 'Edm.Date',
  DateTimeOffset = 'Edm.DateTimeOffset',
  Decimal = 'Edm.Decimal',
  Double = 'Edm.Double',
  Guid = 'Edm.Guid',
  Int16 = 'Edm.Int16',
  Int32 = 'Edm.Int32',
  Int64 = 'Edm.Int64',
  SByte = 'Edm.SByte',
  Single = 'Edm.Single',
  String = 'Edm.String',
}

/**
 * A function which accepts the name in the filter, and returns a name to replace it with.
 *
 * @param name The original name. This uses `/` as a separator.
 * @returns The new name to use instead.
 */
type Rename = (name: string) => string;

const defaultRename: Rename = (name) => name;

const operators = new Map([
  [TokenType.EqualsExpression, '='],
  [TokenType.LesserOrEqualsExpression, '<='],
  [TokenType.LesserThanExpression, '<'],
  [TokenType.GreaterOrEqualsExpression, '>='],
  [TokenType.GreaterThanExpression, '>'],
  [TokenType.NotEqualsExpression, '!='],
  [TokenType.AddExpression, '+'],
  [TokenType.SubExpression, '-'],
  [TokenType.DivExpression, '/'],
  [TokenType.MulExpression, '*'],
  [TokenType.ModExpression, '%'],
]);

type MethodConverter = [Edm[], (...args: any[]) => Fn | Where];

function whereFunction(op: symbol): (haystack: any, needle: any) => Where {
  return (haystack, needle) => where(haystack, { [op]: needle });
}

function fnFunction(name: string): (...args: any[]) => Fn {
  return (...args) => fn(name, ...args);
}

const functions: Record<string, MethodConverter> = {
  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_concat
  contains: [[Edm.String, Edm.String], whereFunction(Op.substring)],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_contains
  concat: [[Edm.String, Edm.String], fnFunction('concat')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_endswith
  endswith: [[Edm.String, Edm.String], whereFunction(Op.endsWith)],

  indexof: [[Edm.String, Edm.String], fnFunction('strpos')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_length
  length: [[Edm.String], fnFunction('length')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_startswith
  startswith: [[Edm.String, Edm.String], whereFunction(Op.startsWith)],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_substring
  substring: [[Edm.String, Edm.SByte, Edm.SByte], fnFunction('substring')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_matchesPattern
  // This is currently not supported by the parser
  // https://github.com/Soontao/odata-v4-parser/issues/36
  matchesPattern: [[Edm.String, Edm.String], whereFunction(Op.iRegexp)],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_tolower
  tolower: [[Edm.Str