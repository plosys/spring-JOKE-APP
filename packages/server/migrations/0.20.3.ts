import { logger } from '@appsemble/node-utils';
import { AppDefinition, TeamsDefinition } from '@appsemble/types';
import { normalize, partialNormalized } from '@appsemble/utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import { parseDocument } from 'yaml';

export const key = '0.20.3';

interface AppDefinitionQuery {
  id: number;
  created: Date;
  yaml: string;
  definition: AppDefinition;
}

interface AppQuery {
  id: number;
  coreStyle: string;
  sharedStyle: string;
  definition: { pages: { name: string }[] };
}

interface MessagesQuery {
  AppId: number;
  language: string;
  messages: { app: Record<string, strin