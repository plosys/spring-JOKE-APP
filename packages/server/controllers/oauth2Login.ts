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
    clientS