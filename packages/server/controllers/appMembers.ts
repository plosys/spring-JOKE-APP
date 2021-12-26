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
    primaryEmail: member.email,
    role: member.role,
    properties: member.properties,
  }));

  if (app.definition.security?.default?.policy !== 'invite') {
    const organization = await Organization.findByPk(app.OrganizationId, {
      include: [
        {
          model: User,
          where: { id: { [Op.not]: app.AppMembers.map((member) => member.UserId) } },
          required: false,
        },
      ],
    });

    for (const user of organization.Users) {
      appMembers.push({
        id: user.id,
        name: user.name,
        primaryEmail: user.primaryEmail,
        role: user?.AppMember?.role ?? app.definition.security.default.role,
      });
    }
  }

  ctx.body = appMembers;
}

export async function getAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        where: { UserId: memberId },
        required: false,
      },
    ],
  });
  if (!app) {
    throw notFound('App not found');
  }

  if (app.definition.security === undefined) {
    throw notFound('App does not have a security definition');
  }

  if (app.AppMembers.length !== 1) {
    throw notFound('App member not found');
  }

  const [member] = app.AppMembers;

  ctx.body = {
    id: member.UserId,
    name: member.name,
    primaryEmail: member.email,
    role: member.role,
  };
}

export async function setAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    request: {
      body: { properties, role },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'id'],
    include: [
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        required: false,
        where: { UserId: memberId },
      },
    ],
  });
  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditApps);

  const user = await User.findByPk(memberId);
  if (!user) {
    throw notFound('User with this ID doesn’t exist.');
  }

  if (!has(app.definition.security.roles, role)) {
    throw badRequest(`Role ‘${role}’ is not defined.`);
  }

  let member = app.AppMembers?.[0];

  if (member) {
    member.role = role;
    if (properties) {
      member.properties = properties;
    }
    await member.save();
  } else {
    member = await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      role,
      properties,
    });
  }

  ctx.body = {
    id: user.id,
    name: member.name,
    primaryEmail: member.email,
    role,
    properties,
  };
}

export async function getAppAccounts(ctx: Context): Promise<void> {
  const { user } = ctx;
  const { baseLanguage, language, query } = parseLanguage(ctx.query?.language);

  const apps = await App.findAll(createAppAccountQuery(user, query));

  ctx.body = apps.map((app) => outputAppMember(app, language, baseLanguage));
}

export async function getAppAccount(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user,
  } = ctx;
  const { baseLanguage, language, query } = parseLanguage(ctx.query?.language);

  const app = await App.findOne({
    where: { id: appId },
    ...createAppAccountQuery(user, query),
  });

  if (!app) {
    throw notFound('App account not found');
  }

  ctx.body = outputAppMember(app, language, baseLanguage);
}

export async function patchAppAccount(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { email, locale, name, picture, properties },
    },
    user,
  } = ctx;
  const { baseLanguage, language, query } = parseLanguage(ctx.query?.language);

  const app = await App.findOne({
    where: { id: appId },
    ...createAppAccountQuery(user, query),
  });

  if (!app) {
    throw notFound('App account not found');
  }

  const [member] = app.AppMembers;
  const result: Partial<AppMember> = {};
  if (email != null && member.email !== email) {
    result.email = email;
    result.emailVerified = false;
    result.emailKey = randomBytes(40).toString('hex');

    const verificationUrl = new URL('/Verify', getAppUrl(app));
    verificationUrl.searchParams.set('token', result.emailKey);

    mailer
      .sendTranslatedEmail({
        appId,
 