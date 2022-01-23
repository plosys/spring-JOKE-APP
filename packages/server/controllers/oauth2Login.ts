import { randomBytes } from 'node:crypto';

import { badRequest, conflict, forbidden, notFound, notImplemented } from '@hapi/boom';
import { Context } from 'koa';
import { Transaction } from 'sequelize';

import { EmailAuthorization, OAuthAuthorization, transactional, User } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { createJWTResponse } from '../utils/createJWTResponse.js';
import { Mailer, Recipient } from '../utils/email/Mailer.js';
import { getAccessToken, getUserInfo } from '../utils/oauth2.js';
import { githubPreset, gitlabPreset, googlePreset, presets } from '../utils/OAuth2Presets.js';

const processEmailAuthorization = async (
  mailer: Mailer,
  id: string,
  name: string,
  email: string,
  verified: boolean,
  transaction: Transaction,
): Promise<void> => {
  const key = verified ? null : randomBytes(40).toString('hex');
  await EmailAuthorization.create(
    { UserId: id, email: email.toLowerCase(), key, verified },
    { transaction },
  );
  if (!verified) {
    await mailer.sendTemplateEmail({ email, name } as Recipient, 'resend', {
      url: `${argv.host}/verify?token=${key}`,
      name: 'The Appsemble Team',
    });
  }
};

export async function registerOAuth2Connection(ctx: Context): Promise<void> {
  const {
    mailer,
    request: {
      body: { authorizationUrl, code },
      headers,
    },
  } = ctx;
  // XXX Replace this with an imported language array when supporting more languages
  let referer: URL;
  try {
    referer = new URL(headers.referer);
  } catch {
    throw badRequest('The referer header is invalid');
  }
  if (referer.origin !== new URL(argv.host).origin) {
    throw badRequest('The referer header is invalid');
  }

  const preset = presets.find((p) => p.authorizationUrl === authorizationUrl);
  let clientId: string;
  let clientSecret: string;

  if (preset === googlePreset) {
    clientId = argv.googleClientId;
    clientSecret = argv.googleClientSecret;
  } else if (preset === gitlabPreset) {
    clientId = argv.gitlabClientId;
    clientSecret = argv.gitlabClientSecret;
  } else if (preset === githubPreset) {
    clientId = argv.githubClientId;
    clientSecret = argv.githubClientSecret;
  }

  if (!clientId || !clientSecret) {
    throw notImplemented('Unknown authorization URL');
  }

  // Exchange the authorization code for an access token and refresh token.
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
  } = await getAccessToken(
    preset.tokenUrl,
    code,
    String(new URL('/callback', argv.host)),
    clientId,
    clientSecret,
  );

  const { sub, ...userInfo } = await getUserInfo(
    accessToken,
    idToken,
    preset.userInfoUrl,
    preset.remapper,
    preset.userEmailsUrl,
  );

  const authorization = await OAuthAuthorization.findOne({
    where: { authorizationUrl, sub },
  });
  if (authorization?.UserId) {
    const dbUser = await User.findOne({ where: { id: authorization.UserId } });
    if (dbUser && !dbUser.primaryEmail && userInfo.email) {
      await transactional(async (transaction) => {
        await dbUser.update({ primaryEmail: userInfo.email }, { transaction });
        await processEmailAuthorization(
          mailer,
          dbUser.id,
          userInfo.name,
          userInfo.email,
          Boolean(userInfo.email_verified),
          transaction,
        );
      });
    }
    // If the combination of authorization url and sub exists, update the entry and allow the user
    // to login to Appsemble.
    await authorization.update({ accessToken, refreshToken }, { where: { authorizationUrl, sub } });
    ctx.body = createJWTResponse(authorization.UserId);
  } else {
    // Otherwise, register an authorization object and ask the user if this is the account they want
    // to use.
    await (authorization
      ? authorization.update({ accessToken, code, refreshToken })
      : OAuthAuthorization.create({
          accessToken,
          authorizationUrl: preset.authorizationUrl,
          code,
          refreshToken,
          sub,
        }));
    ctx.body = userInfo;
  }
}

export async function connectPendingOAuth2Profile(ctx: Context): Promise<void> {
  let {
    mailer,
    request: {
      body: { authorizationUrl, code, timezone },
    },
    user,
  } = ctx;
  const preset = presets.find((p) => p.authorizationUrl === authorizationUrl);

  if (!preset) {
    throw notImplemented('Unknown authorization URL');
  }

  const authorization = await OAuthAuthorization.findOne({ where: { code, authorizationUrl } });

  if (!authorization) {
    throw notFound('No pending OAuth2 authorization found for given state');
  }

  // The user is already logged in to Appsemble.
  if (user) {
    // The OAuth2 authorization is not yet linked to a user, so we link it to the authenticated
    // user. From now on the user will be able to login to this account using this OAuth2 provider.
    if (!authorization.UserId) {
      await authorization.update({ UserId: user.id, code: null });
    }

    // The authorization is already linked to another account, so we disallow linking it again.
    else if (authorization.UserId !== user.id) {
      throw forbidden('This OAuth2 authorization is already linked to an account.');
    }
  }
  // The user is not yet logged in, so they are trying to register a new account using this OAuth2
  // provider.
  else {
    const userInfo = await getUserInfo(
      authorization.accessToken,
      null,
      preset.userInfoUrl,
      preset.remapper,
      preset.userEmailsUrl,
    );
    await transactional(async (transaction) => {
      user = await User.create(
        {
          name: userInfo.name,
          primaryEmail: userInfo.email,
          timezone: userInfo.zoneinfo || timezone,
        },
        { transaction },
      );
      await authorization.update({ UserId: user.id }, { transaction });
      if (userInfo.email) {
        // We’ll try to link this email address to the new user, even though no password has been
        // set.
        const emailAuthorization = await EmailAuthorization.findOne({
          where: { email: userInfo.email.toLowerCase() },
        });
        if (emailAuthorization) {
          if (emailAuthorization.UserId !== user.id) {
            throw conflict('This email address has already been linked to an existing account.');
          }
        } else {
          await p