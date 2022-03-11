import { ConditionActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { Op } from 'sequelize';

import { EmailAuthorization } from '../../models/index.js';
import { handleAction } from '../action.js';
import { getRemapperContext } from '../app.js';
import { actions, ServerActionParameters } from './index.js';

export async function condition({
  action,
  app,
  data,
  user,
  ...params
}: ServerActionParameters<ConditionActionDefinition>): Promise<any> {
  await user?.reload({
    attributes: ['primaryEmail', 'name', 'timezone'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
     