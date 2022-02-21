import { randomUUID } from 'node:crypto';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.13.0';

/**
 * Summary:
 * - Drop user foreign key constraints
 * - Add new column for user ID
 * - Generate new UUID for each user
 * - Add a new UUID column in each related table
 * - Update the new UUID column to the newly mapped user IDs
 * - Remove old column in related tables
 * - Rename new column to UserId in related tables
 * - Remove old id column in user table
 * - Rename newId to id
 * - Re-add foreign key constraints in related tables
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  const users = await db.query<{ id: number }>('SELECT id FROM "User"', {
    raw: true,
    type: QueryTypes.SELECT,
  });

  const tables = [
    { name: 'AppMember', allowNull: false, onDelete: 'cascade' },
    { name: 'AppRating', allowNull: false, onDelete: 'cascade' },
    { name: 'AppSubscription', allowNull: true, onDelete: 'set null' },
    { name: 'Asset', allowNull: true, onDelete: 'set null' },
    { name: 'EmailAuthorization', allowNull: false, onDelete: 'cascade' },
    { name: 'Member', allowNull: false, onDelete: 'cascade' },
    { name: 'OAuth2AuthorizationCode', allowNull: false, onDelete: 'cascade' },
    { name: 'OAuth2ClientCredentials', allowNull: false, onDelete: 'cascade' },
    { name: 'OAuthAuthorization', allowNull: true, onDelete: 'set null' },
    { name: 'Res