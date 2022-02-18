import { logger } from '@appsemble/node-utils';
import { Resource as ResourceType } from '@appsemble/types';
import { checkAppRole, defaultLocale, Permission, remap, TeamRole } from '@appsemble/utils';
import { badRequest, forbidden, internal, notFound, unauthorized } from '@hapi/boom';
import { Context } from 'koa';
import { Op, Order, WhereOptions } from 'sequelize';

import {
  App,
  AppMember,
  AppSubscription,
  Asset,
  Organization,
  Resource,
  ResourceSubscription,
  ResourceVersion,
  Team,
  TeamMember,
  transactional,
  User,
} from '../models/index.js';
import { getRemapperContext } from '../utils/app.js';
import { checkRole } from '../utils/checkRole.js';
import { odataFilterToSequelize, odataOrderbyToSequelize } from '../utils/odata.js';
import {
  extractResourceBody,
  getResourceDefinition,
  processHooks,
  processReferenceHooks,
  processResourceBody,
  renameOData,
} from '../utils/resource.js';

const specialRoles = new Set([
  '$author',
  '$public',
  '$none',
  ...Object.values(TeamRole).map((r) => `$team:${r}`),
]);

/**
 * Generate Sequelize filter objects based on ODATA filters present in the request.
 *
 * @param ctx The context to extract the parameters from.
 * @returns An object containing the generated order and query options.
 */
function generateQuery(ctx: Context): { order: Order; query: WhereOptions } {
  const {
    query: { $filter, $orderby },
  } = ctx;

  try {
    const order =
      $orderby &&
      odataOrderbyToSequelize(
        ($orderby as string)
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__'),
        renameOData,
      );
    const query =
      $filter &&
      odataFilterToSequelize(
        ($filter as string)
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__')
          .replace(/(^|\B)\$author\/id(\b|$)/g, '__author__'),
        Resource,
        renameOData,
      );

    return { order, query };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw badRequest('Unable to process this query', { syntaxError: error.message });
    }
    logger.error(error);
    throw internal('Unable to process this query');
  }
}

/**
 * Verifies whether or not the user has sufficient permissions to perform a resource call.
 * Will throw an 403 error if the user does not satisfy the requirements.
 *
 * @param ctx Koa context of the request
 * @param app App as fetched from the database.
 * This must include the app member and organization relationships.
 * @param resourceType The resource type to check the role for.
 * @param action The resource action to check the role for.
 * @returns Query options to filter the resource for the user context.
 */
async function verifyPermission(
  ctx: Context,
  app: App,
  resourceType: string,
  action: 'count' | 'create' | 'delete' | 'get' | 'patch' | 'query' | 'update',
): Promise<WhereOptions> {
  const resourceDefinition = app.definition.resources[resourceType];

  const {
    query: { $team },
    user,
    users,
  } = ctx;

  if ('studio' in users || 'cli' in users) {
    await checkRole(
      ctx,
      app.OrganizationId,
      action === 'count' || action === 'get' || action === 'query'
        ? Permission.ReadResources
        : Permission.ManageResources,
    );
    return;
  }

  const view = ctx.queryParams?.view;
  const roles =
    (view
      ? resourceDefinition.views[view].roles
      : resourceDefinition[action]?.roles ?? resourceDefinition.roles) || [];

  if (!roles?.length && app.definition.roles?.length) {
    roles.push(...app.definition.roles);
  }

  const functionalRoles = roles.filter((r) => specialRoles.has(r));
  const appRoles = roles.filter((r) => !specialRoles.has(r));
  const isPublic = functionalRoles.includes('$public');
  const isNone = functionalRoles.includes('$none');

  if ($team && !functionalRoles.includes(`$team:${$team}`)) {
    functionalRoles.push(`$team:${$team}`);
  }

  if (!functionalRoles.length && !appRoles.length) {
    throw forbidden('This action is private.');
  }

  if (isPublic && action !== 'count') {
    return;
  }

  if (isNone && !user) {
    return;
  }

  if (!isPublic && !user && (appRoles.length || functionalRoles.length)) {
    throw unauthorized('User is not logged in.');
  }

  const result: WhereOptions[] = [];

  if (functionalRoles.includes('$author') && user && action !== 'create') {
    result.push({ AuthorId: user.id });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Member}`) && user) {
    const teamIds = (
      await Team.findAll({
        where: { AppId: app.id },
        include: [{ model: User, where: { id: user.id } }],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const userIds = (
      await TeamMember.findAll({
        attributes: ['UserId'],
        where: { TeamId: teamIds },
      })
    ).map((tm) => tm.UserId);
    result.push({ AuthorId: { [Op.in]: userIds } });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Manager}`) && user) {
    const teamIds = (
      await Team.findAll({
        where: { AppId: app.id },
        include: [
          { model: User, where: { id: user.id }, through: { where: { role: TeamRole.Manager } } },
        ],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const userIds = (
      await TeamMember.findAll({
        attributes: ['UserId'],
        raw: true,
        where: { TeamId: teamIds },
      })
    ).map((tm) => tm.UserId);
    result.push({ AuthorId: { [Op.in]: userIds } });
  }

  if (app.definition.security && !isPublic) {
    const member = app.AppMembers?.find((m) => m.UserId === user?.id);
    const { policy = 'everyone', role: defaultRole } = app.definition.security.default;
    let role: string;

    if (member) {
      ({ role } = member);
    } else {
      switch (policy) {
        case 'everyone':
          role = defaultRole;
          break;

        case 'organization':
          if (!(await app.Organization.$has('User', user.id))) {
            throw forbidden('User is not a member of the organization.');
          }

          role = defaultRole;
          break;

        case 'invite':
          throw forbidden('User is not a member of the app.');

        default:
          role = null;
      }
    }

    // Team roles are checked separately
    // XXX unify this logic?
    if (
      !appRoles.some((r) => checkAppRole(app.definition.security, r, role, null)) &&
      !result.length
    ) {
      throw forbidden('User does not have sufficient permissions.');
    }
  }

  if (result.length === 0) {
    return;
  }

  return result.length === 1 ? result[0] : { [Op.or]: result };
}

export async function queryResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    queryParams: { $select, $skip, $top },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId', 'definition', 'template'],
    ...(user && {
      include: [
        { model: Organization, attributes: ['id'] },
        {
          model: AppMember,
          attributes: ['role', 'UserId'],
          required: false,
          where: { UserId: user.id },
        },
      ],
    }),
  });

  const view = ctx.queryParams?.view;
  const resourceDefinition = getResourceDefinition(app, resourceType, view);
  const userQuery = await verifyPermission(ctx, app, resourceType, 'query');
  const { order, query } = generateQuery(ctx);

  const resources = await Resource.findAll({
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
    limit: $top,
    offset: $skip,
    order,
    where: {
      [Op.and]: [
        query,
        {
          ...userQuery,
          type: resourceType,
          AppId: appId,
          expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      ],
    },
  });

  const exclude: string[] = app.template ? [] : undefined;
  const include = $select?.split(',').map((s) => s.trim());
  const mappedResources = resources.map((resource) => resource.toJSON({ exclude, include }));

  if (view) {
    const context = await getRemapperContext(
      app,
      app.definition.defaultLanguage || defaultLocale,
      user && {
        sub: user.id,
        name: user.name,
        email: user.primaryEmail,
        email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
        zoneinfo: user.timezone,
      },
    );
    ctx.body = mappedResources.map((resource) =>
      remap(resourceDefinition.views[view].remap, resource, context),
    );
    return;
  }

  ctx.body = mappedResources;
}

export async function countResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId'],
    ...(user && {
      include: [
        { model: Organization, attributes: ['id'] },
        {
          model: AppMember,
          attributes: ['role', 'UserId'],
          required: false,
          where: { UserId: user.id },
        },
      ],
    }),
  });

  const view = ctx.queryParams?.view;
  getResourceDefinition(app, resourceType, view);
  const userQuery = await verifyPermission(ctx, app, resourceType, 'count');
  const { query } = generateQuery(ctx);

  const count = await Resource.count({
    where: {
      [Op.and]: [
        query,
        {
          ...userQuery,
          type: resourceType,
          AppId: appId,
          expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      ],
    },
  });

  ctx.body = count;
}

export async function getResourceById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId'],
    ...(user && {
      include: [
        { model: Organization, attributes: ['id'] },
        {
          model: AppMember,
          attributes: ['role', 'UserId'],
          required: false,
          where: { UserId: user.id },
        },
      ],
    }),
  });
  const view = ctx.queryParams?.view;
  const resourceDefinition = getResourceDefinition(app, resourceType, view);
  const userQuery = await verifyPermission(ctx, app, resourceType, 'get');

  const resource = await Resource.findOne({
    where: {
      AppId: appId,
      id: resourceId,
      type: resourceType,
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
      ...userQuery,
    },
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

  if (view) {
    const context = await getRemapperContext(
      app,
      app.definition.defaultLanguage || defaultLocale,
      user && {
        sub: user.id,
        name: user.name,
        email: user.primaryEmail,
        email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
        zoneinfo: user.timezone,
      },
    );

    ctx.body = remap(resourceDefinition.views[view].remap, resource.toJSON(), context);
    return;
  }

  ctx.body = resource;
}

export async function getResourceTypeSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    query: { endpoint },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: Resource,
        attributes: ['id'],
        where: { type: resourceType },
        required: false,
      },
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          {
            model: ResourceSubscription,
            where: { type: resourceType },
            required: false,
          },
        ],
        required: false,
        where: { endpoint },
      },
    ],
  });
  getResourceDefinition(app, resourceType);

  if (!app.Resources.length) {
    throw notFound('Resource not found.');
  }

  if (!app.AppSubscriptions.length) {
    throw notFound('User is not subscribed to this app.');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw notFound('Subscription not found');
  }

  const result: any = { create: false, update: false, delete: false };
  for (const { ResourceId, action } of appSubscription.ResourceSubscriptions) {
    if (ResourceId) {
      if (!result.subscriptions) {
        result.subscriptions = {};
      }

      if (!result.subscriptions[ResourceId]) {
        result.subscriptions[ResourceId] = { update: false, delete: false };
      }

      result.subscriptions[ResourceId][action] = true;
    } else {
      result[action] = true;
    }
  }

  ctx.body = result;
}

export async function getResourceSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    query: { endpoint },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: Resource,
        attributes: ['id'],
        where: { id: resourceId },
        required: false,
      },
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          {
            model: ResourceSubscription,
            where: { type: resourceType, ResourceId: resourceId },
            required: false,
          },
        ],
        required: false,
        where: { endpoint },
      },
    ],
  });
  getResourceDefinition(app, resourceType);

  if (!app.Resources.length) {
    throw notFound('Resource not found.');
  }

  const subscriptions = app.AppSubscriptions?.[0]?.ResourceSubscriptions ?? [];
  const result: any = { id: resourceId, update: false, delete: false };

  for (const { action } of subscriptions) {
    result[action] = true;
  }

  ctx.body = result;
}

export async function createResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    user,
  } = ctx;
  const action = 'create';

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
    in