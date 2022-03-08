// eslint-disable-next-line unicorn/import-style
import crypto from 'node:crypto';

import {
  createThemeURL,
  defaultLocale,
  getAppBlocks,
  mergeThemes,
  parseBlockName,
} from '@appsemble/utils';
import { Context } from 'koa';
import { Op } from 'sequelize';

import {
  AppMessages,
  AppOAuth2Secret,
  AppSamlSecret,
  BlockAsset,
  BlockVersion,
} from '../../models/index.js';
import { getApp, getAppUrl } from '../../utils/app.js';
import { argv } from '../../utils/argv.js';
import { organizationBlocklist } from '../../utils/organizationBlocklist.js';
import { createGtagCode, createSettings, makeCSP, render } from '../../utils/render.js';
import { getSentryClientSettings } from '../../utils/sentry.js';
import { bulmaURL, faURL } from '../../utils/styleURL.js';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 *
 * @param ctx The Koa context.
 * @returns void
 */
export async function indexHandler(ctx: Context): Promise<void> {
  const { hostname, path } = ctx;
  const { host } = argv;

  const { app, appPath, organizationId } = await getApp(ctx, {
    attributes: [
      'domain',
      'definition',
      'googleAnalyticsID',
      'sentryDsn',
      'sentryEnvironment',
      'id',
      'path',
      'OrganizationId',
      'sharedStyle',
      'coreStyle',
      'vapidPublicKey',
      'showAppsembleLogin',
      'showAppsembleOAuth2Login',
      'updated',
    ],
    include: [
      {
        attributes: ['icon', 'id', 'name'],
        model: AppOAuth2Secret,
      },
      {
        attributes: ['language'],
        model: AppMessages,
      },
      {
        attributes: ['icon', 'id', 'name'],
        model: AppSamlSecret,
      },
    ],
  });

  if (!app) {
    if (organizationId && !appPath) {
      return ctx.redirect(
        organizationBlocklist.includes(organizationId)
          ? host
          : String(new URL(`/organizations/${organizationId}`, host)),
      );
    }
    ctx.status = 404;
    return render(ctx, 'app/error.html', {
      bulmaURL,
      faURL,
      message: 'The app you are looking for could not be found.',
    });
  }

  const appUrl = getAppUrl(app);
  if (appUrl.hostname !== hostname) {
    appUrl.pathname = path;
    appUrl.search = ctx.querystring;
    ctx.redirect(String(appUrl));
    return;
  }

  const blocks = getAppBlocks(app.definition);
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'v