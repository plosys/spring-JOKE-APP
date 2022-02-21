import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.13.5';

/**
 * Summary:
 * - Add clonable field to resources
 * - Add the AppOAuth2Secret table.
 * - Add the AppOAuth2Authorization table.
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding new table AppOAuth2Secret');
  await queryInterface.createTable('AppOAuth2Secret', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    authorizationUrl: { type: DataTypes.STRING, allowNull: false },
    tokenUrl: { type: DataTypes.STRING, allow