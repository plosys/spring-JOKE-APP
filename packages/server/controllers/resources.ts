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
  '$none'