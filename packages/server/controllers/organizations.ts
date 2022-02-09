
import { randomBytes } from 'node:crypto';

import { Permission } from '@appsemble/utils';
import { badRequest, conflict, forbidden, notAcceptable, notFound } from '@hapi/boom';
import { isEqual, parseISO } from 'date-fns';
import { Context } from 'koa';
import { col, fn, literal, Op, QueryTypes, UniqueConstraintError } from 'sequelize';

import {
  App,
  AppRating,
  BlockVersion,
  EmailAuthorization,
  getDB,
  Organization,
  OrganizationInvite,
  User,
} from '../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { checkRole } from '../utils/checkRole.js';
import { createBlockVersionResponse } from '../utils/createBlockVersionResponse.js';
import { serveIcon } from '../utils/icon.js';
import { organizationBlocklist } from '../utils/organizationBlocklist.js';

export async function getOrganizations(ctx: Context): Promise<void> {
  const organizations = await Organization.findAll({
    order: [['id', 'ASC']],
    include: [
      { model: App, required: false, where: { visibility: 'public' }, attributes: ['id'] },
      { model: BlockVersion, required: false, where: { visibility: 'public' }, attributes: ['id'] },
    ],
    attributes: {
      include: [[literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });

  ctx.body = organizations
    .filter((organization) => organization.Apps.length || organization.BlockVersions.length)
    .map((organization) => ({
      id: organization.id,
      name: organization.name,
      description: organization.description,
      website: organization.website,
      email: organization.email,
      iconUrl: organization.get('hasIcon')
        ? `/api/organizations/${organization.id}/icon?updated=${organization.updated.toISOString()}`
        : null,
    }));
}

export async function getOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    attributes: {
      include: [[literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  ctx.body = {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    website: organization.website,
    email: organization.email,
    iconUrl: organization.get('hasIcon')
      ? `/api/organizations/${organization.id}/icon?updated=${organization.updated.toISOString()}`
      : null,
  };
}

export async function getOrganizationApps(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    user,
  } = ctx;
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx.query?.language);

  const memberInclude = user
    ? { include: [{ model: User, where: { id: user.id }, required: false }] }
    : {};
  const organization = await Organization.findByPk(organizationId, memberInclude);
  if (!organization) {
    throw notFound('Organization not found.');
  }

  const apps = await App.findAll({
    attributes: {
      include: [[literal('"App".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
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
      ...languageQuery,
    ],
    where: { OrganizationId: organizationId },
  });

  const filteredApps =
    user && organization.Users.length ? apps : apps.filter((app) => app.visibility === 'public');

  const ratings = await AppRating.findAll({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: filteredApps.map((app) => app.id) },
    group: ['AppId'],
  });

  ctx.body = filteredApps
    .map((app) => {
      const rating = ratings.find((r) => r.AppId === app.id);

      if (rating) {
        Object.assign(app, {