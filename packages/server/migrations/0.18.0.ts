import { randomUUID } from 'node:crypto';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.18.0';

/**
 * Summary:
 * - Add BlockMessages table
 * - Add id to BlockVersion
 * - Add BlockVersionId to BlockAsset
 * - Add unique constraint of OrganizationId, name, version to BlockVersion
 * - Change content and filename in BlockAsset to be non-nullable
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Fetching block versions and generating new IDs');
  const versions = (
    await db.query<{ name: string; OrganizationId: string; version: string }>(
      'SELECT "OrganizationId", version, name FROM "BlockVersion"',
      { raw: true, type: QueryTypes.SELECT },
    )
  ).map((version) => ({ ...version, id: randomUUID() }));

  logger.info('Adding column id to BlockVersion');
  await queryInterface.addColumn('BlockVersion', 'id', {
    type: DataTypes.UUID,
    allowNull: true,
  });

  logger.info('Adding column BlockVersionId to Blo