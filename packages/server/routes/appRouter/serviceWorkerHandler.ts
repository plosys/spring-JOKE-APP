import { readFile } from 'node:fs/promises';

import { getAppBlocks, parseBlockName, prefixBlockURL } from '@appsemble/utils';
import { Context } from 'koa';
import { Op } from 'sequelize';

import { BlockAsset, BlockVersion } from '../../models/index.js';
import { getApp } from '../../utils/app.js';

/**
 * A handler used to serve the service worker output from Webpack from the client root.
 *
 * @param ctx The Koa context.
 */
export async function serviceWorkerHandler(ctx: Context): Promise<void> {
  const production = process.env.NODE_ENV === 'production';
  const filename = production ? '/service-worker.js' : '/app/service-worker.js';
  const serviceWorker = await (production
    ? readFile(new URL('../../../../dist/app/service-worker.js', import.meta.url), 'utf8')
    : ctx.fs.promises.readFile(filename, 'utf8'));
  const { app } = await getApp(ctx, {
    attributes: ['definition'],
  });
  ctx.assert(app, 404, 'App does not exist.');

  const blocks = getAppBlocks(app.definition);
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          BlockVersionId: { [Op.col]: 'BlockVersion.id' },
        },
      },
    ],
    where: {
      [Op.or]: blocks.map(({ type, version }) => {
        const [OrganizationId, name] = parseBlockName(type);
        return { name, OrganizationId, version };
      }),
    },
  });

  ctx.body = `const block