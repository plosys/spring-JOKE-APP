import { randomBytes } from 'node:crypto';

import { logger } from '@appsemble/node-utils';
import { AppAccount, AppMember as AppMemberType, SSOConfiguration } from '@appsemble/types';
import { has, Permission } from '@appsemble/utils';
import { badRequest, conflict, notFound } from '@hapi/boom';
import { hash } from 'bcrypt';
import { Context } from 'koa';
import {
  DatabaseError,
  FindOptions,
  IncludeOptions,
  literal,
  Op,
  UniqueConstraintError,
} from 'sequelize';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppSamlAuthorization,
  AppSamlSecret,
  Organization,
  transactional,
  User,
} from '../models/index.js';
import { applyAppMessages, getAppUrl, parseLanguage } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { checkRole } from '../utils/checkRole.js';
import { createJWTResponse } from '../utils/createJWTResponse.js';
import { getGravatarUrl } from '../utils/gravatar.js';
import { serveIcon } from '../utils/icon.js';

/**
 * Create an app member as JSON output from an app.
 *
 * @param app The app to output. A single app member should be present.
 * @param language The language to use.
 * @param baseLanguage The base language to use.
 * @returns The app member of the app.
 */
function outputAppMember(app: App, language: string, baseLanguage: string): AppAccount {
  const [member] = app.AppMembers;

  applyAppMessages(app, language, baseLanguage);

  const sso: SSOConfiguration[] = [];

  if (member.AppOAuth2Authorizations) {
    for (const { AppOAuth2Secret: secret } of member.AppOAuth2Authorizations) {
      sso.push({
        type: 'oauth2',
        icon: secret.icon,
        url: secret.dataValues.authorizatio,
        name: secret.name,
      });
    }
  }
  if (member.AppSamlAuthorizations) {
    for (const { AppSamlSecret: secret } of member.AppSamlAuthorizations) {
      sso.push({
        type: 'saml',
        icon: secret.icon,
        url: secret.ssoUrl,
        name: secret.name,
      });
    }
  }

  return {
    app: app.toJSON(),
    id: member.id,
    email: member.email,
    emailVerified: member.emailVerified,
    picture: member.picture
      ? String(
          new URL(
            `/api/apps/${app.id}/members/${
              member.UserId
            }/picture?updated=${member.updated.getTime()}`,
            argv.host,
          ),
        )
      : getGravatarUrl(member.email),
    name: member.name,
    role: member.role,
    properties: member.properties ?? {},
    sso,
  };
}

function createAppAccountQuery(user: User, include: IncludeOptions[]): FindOptions {
  return {
    attributes: {
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
      exclude: ['App.icon', 'maskableIcon', 'coreStyle', 'sharedStyle'],
    },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        where: { UserId: user.id },
        include: [
          {
            model: AppSamlAuthorization,
            required: false,
            include: [AppSamlSecret],
          },
          {
            model: AppOAuth2Authorization,
            required: false,
            include: [AppOAuth2Secret],
          },
        ],
      },
      ...include,
    ],
  };
}

export async function getAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition'],
    include: [
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        include: [User],
      },
    ],
  });
  if (!app) {
    throw notFound('App not found');
  }

  const appMembers: AppMemberType[] = app.AppMembers.map((member) => ({
    id: member.UserId,
    name: member.name,
    primaryEmail: