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
    INNER JOIN "Organization" o ON o.id = bv."OrganizationId"
    WHERE bv.created IN (
      SELECT MAX(created)
      FROM "BlockVersion"
      GROUP BY "OrganizationId", name
    )`,
    { type: QueryTypes.SELECT },
  );

  ctx.body = await createBlockVersionResponse(ctx, blockVersions, (blockVersion) => {
    const {
      OrganizationId,
      actions,
      description,
      events,
      examples,
      hasIcon,
      hasOrganizationIcon,
      layout,
      longDescription,
      name,
      organizationUpdated,
      parameters,
      version,
      wildcardActions,
    } = blockVersion;
    let iconUrl = null;
    if (hasIcon) {
      iconUrl = `/api/blocks/@${OrganizationId}/${name}/versions/${version}/icon`;
    } else if (hasOrganizationIcon) {
      iconUrl = `/api/organizations/${OrganizationId}/icon?updated=${organizationUpdated.toISOString()}`;
    }
    return {
      name: `@${OrganizationId}/${name}`,
      description,
      longDescription,
      version,
      actions,
      events,
      examples,
      iconUrl,
      layout,
      parameters,
      wildcardActions,
    };
  });
}

interface PublishBlockBody extends Omit<BlockManifest, 'files'> {
  files: File[];
  icon: File;
  examples: string[];
}

export async function publishBlock(ctx: Context): Promise<void> {
  const { files, icon, messages, ...data }: PublishBlockBody = ctx.request.body;
  const { name, version } = data;
  const actionKeyRegex = /^[a-z]\w*$/;

  const [org, blockId] = name.split('/');
  const OrganizationId = org.slice(1);

  if (data.actions) {
    for (const key of Object.keys(data.actions)) {
      if (!actionKeyRegex.test(key) && key !== '$any') {
        throw badRequest(`Action “${key}” does match /${actionKeyRegex.source}/`);
      }
    }
  }

  if (data.examples?.length) {
    const validator = new Validator();
    validator.customFormats.fontawesome = () => true;
    validator.customFormats.remapper = () => true;
    validator.customFormats.action = () => true;
    validator.customFormats['event-listener'] = () => true;
    validator.customFormats['event-emitter'] = () => true;

    for (const exampleString of data.examples) {
      let example: BlockDefinition;
      try {
        example = parse(exampleString);
      } catch {
        throw badRequest(`Error parsing YAML example:\n${exampleString}`);
      }
      if (!example || typeof example !== 'object') {
        continue;
      }
      const { required, ...blockSchema } = structuredClone(
        ctx.openApi.document.components.schemas.BlockDefinition,
      ) as OpenAPIV3.NonArraySchemaObject;

      delete blockSchema.properties.name;
      delete blockSchema.properties.version;

      const actionsSchema = blockSchema.properties.actions as OpenAPIV3.NonArraySchemaObject;

      delete actionsSchema.additionalProperties;
      if (example.actions) {
        actionsSchema.properties = Object.fromEntries(
          Object.keys(example.actions).map((key) => [
            key,
            { $ref: '#/components/schemas/ActionDefinition' },
          ]),
        );
      }
      const blockEventsSchema: OpenAPIV3.NonArraySchemaObject = {
        type: 'object',
        additionalProperties: false,
        properties: {},
      };
      blockSchema.properties.events = blockEventsSchema;
      if (example.events) {
        if (example.events.emit) {
          blockEventsSchema.properties.emit = has(example.events.emit, '$any')
            ? { type: 'object', additionalProperties: { type: 'string' } }
            : {
                type: 'object',
                properties: Object.fromEntries(
                  Object.keys(example.events.emit).map((emitter) => [emitter, { type: 'string' }]),
                ),
              };
        }
        if (example.events.listen) {
          blockEventsSchema.properties.listen = has(example.events.listen, '$any')
            ? { type: 'object', additionalProperties: { type: 'string' } }
            : {
                type: 'object',
                properties: Object.fromEntries(
                  Object.keys(example.events.listen).map((listener) => [
                    listener,
                    { type: 'string' },
                  ]),
                ),
              };
        }
      }

      const validationResult = ctx.openApi.validate(example, blockSchema, { throw: false });
      handleValidatorResult(validationResult, 'Validation failed for block example');
    }
  }

  if (messages) {
    const messageKeys = Object.keys(messages.en);
    for (const [language, record] of Object.