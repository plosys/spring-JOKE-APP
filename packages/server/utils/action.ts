import { logger } from '@appsemble/node-utils';
import { defaultLocale, remap, RemapperContext } from '@appsemble/utils';

import { actions, ServerActionParameters } from './actions/index.js';
import { argv } from './argv.js';

export async function handleAction(
  action: (params: ServerActionParameters) => Promise<unknown>,
  params: ServerActionParameters,
): Promise<void> {
  logger.info(`Running action: ${params.action.type}`);
  const url = new URL(argv.host);
  url.hostname =
    params.app.domain || `${params.app.path}.${params.app.OrganizationId}.${url.hostname}`;
  const appUrl = String(url);
  const context: RemapperContext = params.internalContext ?? {
    appId: params.app.id,
    appUrl,
    url: String(url),
    context: {},
    history: [],
    // XXX: Implement getMessage and default language selections
    getMessage() {
      return null;
    },
    userInfo: undefined,
    locale: params.app.definition.defaultLanguage ?? defaultLocale,
  };
  let data =
    'remapBefore' in params.action
      ? remap(params.action.remapBefore, params.data, context)
      : params.data;

  const updatedContext = { ...context, history: [...context.history, data] };

  try {
    data = await action({ ...params, data, internalContext: updatedContext });
    if ('remapAfter' in params.action) {
      data = remap(params.action.remapAfter, data, updatedContext);
    }
    if (params.action.onSuccess) {
      await handleAction(actions[params.action.onSuccess.type], {
        ...params,
        action: params.action.onSuccess,
        data,
        internalContext: updatedContext,
      });
    }
  } catch (error) {
    logger.error(`Error running action: ${params.action.type}`);
    if (params.action.onError) {
      return handleAction(actions[params.action.onError.type], {
        ...params,
        action: params.action.onError,
        data,
        internalContext: updatedContext,
      });
    }
    throw error;
  }
  logger.info(`Successfully ran action: ${params.action.type}`);
}
