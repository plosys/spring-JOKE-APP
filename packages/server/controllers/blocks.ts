import { logger } from '@appsemble/node-utils';
import { BlockDefinition, BlockManifest } from '@appsemble/types';
import { has, Permission } from '@appsemble/utils';
import { badRequest, conflict, notFound } from '@hapi/boom';
import { isEqual, parseISO } from 'date-fns';
import { Validator } from 'jsonschema';
import { Context } from 'koa';
import { File } from 'koas-body-parser';
import { OpenAPIV3 } from 'openapi-types';
import semver from 'semver';
import { DatabaseError, literal, QueryTypes, UniqueConstraintError } from 'sequelize';
import { parse } from 'yaml';

import {
  BlockAsset,
  BlockMessages,
  BlockVersion,
  getDB,
  Organization,
  transactional,
} from '../models/index.js';
import { blockVersionToJson } from '../utils/block.js';
import { checkRole } from '../utils/checkRole.js';
import { createBlockVersionResponse } from '../utils/createBlockVersionResponse.js';
import { serveIcon } from '../utils/icon.js';
import { handleValidatorResult } from '../utils/jsonschema.js';

export async function getBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, organizationId },
  } = ctx;

  const blockVersion = await BlockVersion.findOne({
    attributes: [
      'created',
      'description',
      'examples',
      'longDescription',
      'name',
      'version',
      'actions',
      'events',
      'layout',
      'parameters',
      'wildcardActions',
      [literal('"BlockVersion".icon IS NOT NULL'), 'hasIcon'],
    ],
    where: { name: blockId, OrganizationId: organizationId },
    include: [
      { model: BlockAsset, attributes: ['filename'] },
      {
        model: Organization,
        attributes: ['id', 'updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      },
      {
        model: BlockMessages,
        attributes: ['language'],
        required: false,
      },
    ],
    order: [['created', 'DESC']],
  });

  if (!blockVersion) {
    throw notFound('Block definition not found');
  }

  ctx.body = blockVersionToJson(blockVersion);
}

export async function queryBlocks(ctx: Context): Promise<void> {
  // Sequelize does not support subqueries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const blockVersions = await getDB().query<
    BlockVersion & { hasIcon: boolean; hasOrganizationIcon: boolean; organizationUpdated: Date }
  >(
    `SELECT
      bv.actions,
      bv.description,
      bv.events,
      bv.examples,
      bv.icon IS NOT NULL as "hasIcon",
      bv.layout,
      bv."longDescription",
      bv.name,
      bv."OrganizationId",
      bv.parameters,
      bv.version,
      bv.visibility,
      bv."wildcardActions",
      o.icon IS NOT NULL as "hasOrganizationIcon",
      o.updated AS "organizationUpdated"
    FROM "BlockVersion" bv
    INNER JOIN "Organization" o ON o.id 