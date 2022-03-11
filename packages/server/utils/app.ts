import { UserInfo } from '@appsemble/types';
import {
  defaultLocale,
  extractAppMessages,
  has,
  IntlMessageFormat,
  objectCache,
  RemapperContext,
} from '@appsemble/utils';
import memoize from '@formatjs/fast-memoize';
import { badRequest } from '@hapi/boom';
import { Context } from 'koa';
import tags from 'language-tags';
import { FindOptions, IncludeOptions, Op } from 'sequelize';

import { App, AppMessages } from '../models/index.js';
import { argv } from './argv.js';
import { mergeMessages } from './mergeMessages.js';

// @ts-expect-error @formatjs/fast-memoize is typed for faux ESM
const getNumberFormat = memoize.default(
  (locale: string, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, opts),
);
// @ts-expect-error @formatjs/fast-memoize is typed for faux ESM
const getPluralRules = memoize.default(
  (locale: string, opts: Intl.PluralRulesOptions) => new Intl.PluralRules(locale, opts),
);

interface GetAppValue {
  /**
   * The app for the request context.
   */
  app?: App;

  /**
   * The path of the app being requested.
   */
  appPath?: string;

  /**
   * The organization Id of the app being requested.
   */
  organizationId?: string;
}

/**
 * Get an app from the database based on the Koa context and URL.
 *
 * @param ctx The Koa context.
 * @param queryOptions Additional Sequelize query options. `where` will be overwritten.
 * @param url The URL to find the app for. This defaults to the context request origin.
 * @returns The app matching the url.
 */
export async function getApp(
  { origin }: Pick<Context, 'origin'>,
  queryOptions: FindOptions,
  url = origin,
): Promise<GetAppValue> {
  const platformHost = new URL(argv.host).hostname;
  const { hostname } = new URL(url);

  const value: GetAppValue = {
    app: undefined,
    appPath: undefined,
    organizationId: undefined,
  };

  if (hostname.endsWith(`.${platformHost}`)) {
    const subdomain = hostname
      .slice(0, Math.max(0, hostname.length - platformHost.length - 1))
      .split('.');
    if (subdomain.length === 1) {
      [value.organizationId] = subdomain;
    } else if (subdo