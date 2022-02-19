import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { deflateRaw } from 'node:zlib';

import { logger } from '@appsemble/node-utils';
import { SAMLStatus } from '@appsemble/types';
import { stripPem, wrapPem } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { DOMImplementation, DOMParser } from '@xmldom/xmldom';
import axios from 'axios';
import { Context } from 'koa';
import forge from 'node-forge';
import { toXml } from 'xast-util-to-xml';
import { x as h } from 'xastscript';
import { SignedXml, xpath } from 'xml-crypto';

import { AppSamlAuthorization } from '../models/AppSamlAuthorization.js';
import { App, AppMember, AppSamlSecret, transactional, User } from '../models/index.js';
import { SamlLoginRequest } from '../models/SamlLoginRequest.js';
import { argv } from '../utils/argv.js';
import { createOAuth2AuthorizationCode } from '../utils/model.js';

/**
 * An enum for managing known XML namespaces.
 */
enum NS {
  ds = 'http://www.w3.org/2000/09/xmldsig#',
  md = 'urn:oasis:names:tc:SAML:2.0:metadata',
  saml = 'urn:oasis:names:tc:SAML:2.0:assertion',
  samlp = 'urn:oasis:names:tc:SAML:2.0:protocol',
  xmlns = 'http://www.w3.org/2000/xmlns/',
}

const deflate = promisify(deflateRaw);
const dom = new DOMImplementation();
const parser = new DOMParser();

export async function createAuthnRequest(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: {
      body: { redirectUri, scope, state, timezone },
    },
    user,
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
    attributes: [],
    include: [
      {
        model: AppSamlSecret,
        attributes: ['ssoUrl', 'spPrivateKey'],
        where: { id: appSamlSecretId },
        required: false,
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const [secret] = app.AppSamlSecrets;

  if (!secret) {
    throw notFound('SAML secret not found');
  }

  const loginId = `id${randomUUID()}`;
  const doc = dom.createDocument(NS.samlp, 'samlp:AuthnRequest', null);
  const samlUrl = new URL(`/api/apps/${appId}/saml/${appSamlSecretId}`, argv.host);

  const authnRequest = doc.documentElement;
  authnRequest.setAttributeNS(NS.xmlns, 'xmlns:saml', NS.saml);
  authnRequest.setAttribute('AssertionConsumerServiceURL', `${samlUrl}/acs`);
  authnRequest.setAttribute('Destination', secret.ssoUrl);
  authnRequest.setAttribute('ID', loginId);
  authnRequest.setAttribute('Version', '2.0');
  authnRequest.setAttribute('IssueInstant', new Date().toISOString());

  const issuer = doc.createElementNS(NS.saml, 'saml:Issuer');
  issuer.textContent = `${samlUrl}/metadata.xml`;
  // eslint-disable-next-line unicorn/prefer-dom-node-append
  authnRequest.appendChild(issuer);

  const nameIDPolicy = doc.createElementNS(NS.samlp, 'samlp:NameIDPolicy');
  nameIDPolicy.setAttribute('Format', 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
  // eslint-disable-next-line unicorn/prefer-dom-node-append
  authnRequest.appendChild(nameIDPolicy);

  logger.verbose(`SAML request XML: ${doc}`);
  const samlRequest = await deflate(Buffer.from(String(doc)));
  const redirect = new URL(secret.ssoUrl);
  redirect.searchParams.set('SAMLRequest', samlRequest.toString('base64'));
  redirect.searchParams.set('RelayState', argv.host);
  redirect.searchParams.set('SigAlg', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1');

  const privateKey = forge.pki.privateKeyFromPem(secret.spPrivateKey);

  const sha = forge.md.sha1.create().update(String(redirect.searchParams));
  const signatureBinary = privateKey.sign(sha);
  const signature = Buffer.from(signatureBinary).toString('base64');
  redirect.searchParams.set('Signature', signature);

  await SamlLoginRequest.create({
    id: loginId,
    AppSamlSecretId: appSamlSecretId,
    UserId: user?.id,
    redirectUri,
    state,
    scope,
    timezone,
  });

  ctx.body = { redirect: String(redirect) };
}

export async function assertConsumerService(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: {
      body: { RelayState, SAMLResponse },
    },
  } = ctx;

  const prompt = (status: SAMLStatus, query?: Record<string, string>): void =>
    ctx.redirect(`/saml/response/${status}${query ? `?${new URLSearchParams(query)}` : ''}`);

  if (RelayState !== argv.host) {
    return prompt('invalidrelaystate');
  }

  const secret = await AppSamlSecret.findOne({
    attributes: ['entityId', 'idpCertificate'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  if (!secret) {
    r