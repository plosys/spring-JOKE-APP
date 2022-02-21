import { AppsembleError } from '@appsemble/node-utils';
import { QueryTypes, Sequelize } from 'sequelize';

export const key = '0.19.4';

/**
 * Summary:
 * - Update JSON of apps that contain subPages
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const apps = await db.query<{
    id: string;
    definition: {
      pages: { type: 'flow' | 'page' | 'tabs'; subPages: any; s