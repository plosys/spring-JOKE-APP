
import { randomBytes } from 'node:crypto';

import * as types from '@appsemble/types';
import { forbidden } from '@hapi/boom';
import { addMinutes } from 'date-fns';

import * as models from '../models/index.js';
import { argv } from './argv.js';

/**
 * Resolves the icon url for an app based on whether it’s present and when it was updated.
 *
 * @param app The app to resolve the icon url for.
 * @returns A URL that can be safely cached.
 */
export function resolveIconUrl(app: models.App): string {
  const hasIcon = app.get('hasIcon') ?? Boolean(app.icon);

  if (hasIcon) {
    return `/api/apps/${app.id}/icon?${new URLSearchParams({
      maskable: 'true',
      updated: app.updated.toISOString(),
    })}`;
  }
