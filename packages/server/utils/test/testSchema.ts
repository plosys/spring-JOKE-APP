import { parse } from 'node:path';

import { Sequelize } from 'sequelize';

import { initDB, InitDBParams } from '../../models/index.js';

/**
 * Create a temporary test database for each test in a test module or describe block.
 *
 * The database will be truncated after each test. It will be deleted after all tests have run.
 *
 * @param meta The `import.meta` property.
 * @param options Additional sequelize options.
 */
export function useTestDatabase(meta: ImportMeta, options: InitDBParams = {}): void {
  let dbName: string;
  let rootDB: Sequelize;
  let db: Sequelize;

  beforeAll(async () => {
    const database =
      process.env.DATABASE_URL || 'postgres://admin:password@localhost