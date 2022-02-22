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
  messages: { app: Record<string, string> };
}

function processAppsAndMessages(
  appsInput: AppQuery[],
  messagesInput: MessagesQuery[],
  downMigration?: boolean,
): { apps: AppQuery[]; messages: MessagesQuery[] } {
  const apps = structuredClone(appsInput);
  const messages = structuredClone(messagesInput);

  for (const app of apps) {
    const appMessages = messages.filter((m) => m.AppId === app.id);
    const replacementMap = app.definition.pages
      .map((page, index) =>
        downMigration
          ? [normalize(page.name), String(index)]
          : [String(index), normalize(page.name)],
      )
      // Reversed in order to prevent pages.10 being replaced by pages.1
      .reverse();

    logger.info(`Processing app ${app.id}`);
    for (const [oldKey, newKey] of replacementMap) {
      for (const appMessage of appMessages) {
        for (const name of Object.keys(appMessage.messages.app)) {
          if (name === `pages.${oldKey}` || name.startsWith(`pages.${oldKey}.`)) {
            appMessage.messages.app[name.replace(oldKey, newKey)] = appMessage.messages.app[name];
            delete appMessage.messages.app[name];
          }
        }
      }

      if (app.coreStyle?.includes(`pages.${oldKey}`)) {
        app.coreStyle = app.coreStyle.replaceAll(`pages.${oldKey}`, `pages.${newKey}`);
      }

      if (app.sharedStyle?.includes(`pages.${oldKey}`)) {
        app.sharedStyle = app.sharedStyle.replaceAll(`pages.${oldKey}`, `pages.${newKey}`);
      }
    }
  }

  return { apps, messages };
}

/**
 * Summary:
 * - Add table `TeamInvite`
 * - Convert all path references for apps to use the page name instead of the index.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding table `TeamInvite` ');
  await queryInterface.createTable('TeamInvite', {
    TeamId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: 'Team', key: 'id' },
      allowNull: false,
    },
    email: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    key: { type: DataTypes.STRING, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });

  const unmigrated = await db.query<AppDefinitionQuery>(
    `SELECT DISTINCT ON (a.id) a.id, s.created, s.yaml, a.definition
     FROM "App" a
     INNER JOIN "Team" ON "Team"."AppId" = a.id
     INNER JOIN "AppSnapshot" s ON a.id = s."AppId"
     ORDER BY a.id, s.created DESC`,
    { type: QueryTypes.SELECT },
  );

  for (const { definition, id, yaml } of unmigrated) {
    const doc = parseDocument(yaml);
    if (!definition.security) {
      logger.warn(`App ${id} has teams, but no security definition. Adding default role “User”`);
      const securityDefinition = { roles: { User: {} }, default: { role: 'User' } };
      definition.security = securityDefinition;
      doc.setIn(['security'], securityDefinition);
    }
    const teamsDefinition: TeamsDefinition = { join: 'anyone', invite: ['$team:member'] };
    definition.security.teams = teamsDefinition;
    doc.setIn(['security', 'teams'], teamsDefinition);
    logger.warn(`Adding old teams behavior for app ${id}`);
    await db.query('UPDATE "App" SET definition = ? where id = ?', {
      type: QueryTypes.UPDATE,
      replacements: [JSON.stringify(definition), id],
    });
    await db.query('INSERT INTO "AppSnapshot" (created, yaml, "AppId") VALUES (NOW(), ?, ?)', {
      type: QueryTypes.INSERT,
      replacements: [String(doc), id],
    });
  }

  logger.info('Starting path reference migration');
  const messagesInput = await db.query<MessagesQuery>(
    'SELECT "AppId", language, messages FROM "AppMessages" WHERE messages->>\'app\' ~ \'"pages\\.\\d+\'',
    {
      type: QueryTypes.SELECT,
    },
  );

  const appsInput = messagesInput.length
    ? await db.query<AppQuery>(
        'SELECT id, "coreStyle", "sharedStyle", definition FROM "App" WHERE "coreStyle" ~ \'pages\\.\\d+\' OR "sharedStyle" ~ \'pages\\.\\d+\' OR id IN (?)',
        { type: QueryTypes.SELECT, replacements: [messagesInput.map((m) => m.AppId)] },
      )
    : await db.query<AppQuery>(
        'SELECT id, "coreStyle", "sharedStyle", definition FROM "App" WHERE "coreStyle" ~ \'pages\\.\\d+\' OR "sharedStyle" ~ \'pages\\.\\d+\'',
        { type: QueryTypes.SELECT },
      );

  const { apps, messages 