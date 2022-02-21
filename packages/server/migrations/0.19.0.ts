import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.0';

/**
 * Summary:
 * - Add columns `consent`, `password`, `emailKey`, and `resetKey` to AppMember
 * - Renames column `showAppsembleLogin` to `showAppsembleOAuth2Login` in `App`
 * - Adds column `showAppsembleLogin` to `App`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `password` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'password', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `emailKey` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'emailKey', {
    type: DataTypes.STRING,
  });
  logger.info('Adding column `resetKey` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'resetKey', {
    type: DataTypes.STRING,
  });

  logger.info('Adding unique index between columns `AppId` and `email` for `AppMember`');
  await queryInterface.addConstraint('AppMember', {
    name: 'UniqueAppMemberEmailIndex',
    fields: ['AppId', 'email'],
    type: 'unique',
  });

  logger.info('Renaming column `showAppsembleLogin` to `showAppsembleOAuth2Login` in `App`');
  await queryInterface.renameColumn('App', 'showAppsembleLogin', 'showAppsembleOAuth2Login');

  logger.info('Adding column `showAppsembleLogin` to `App`');
  await queryInterface.addColumn('App', 'showAppsembleLogin', {
    type: DataTypes.STRING,
    defaultValue: false,
  }