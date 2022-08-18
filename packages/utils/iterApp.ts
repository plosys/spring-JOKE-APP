
import { ActionDefinition, AppDefinition, BlockDefinition, PageDefinition } from '@appsemble/types';

export type Prefix = (number | string)[];

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type IterCallback<T> = (item: T, path: Prefix) => boolean | void;

interface IterCallbacks {
  onPage?: IterCallback<PageDefinition>;
  onBlockList?: IterCallback<BlockDefinition[]>;
  onBlock?: IterCallback<BlockDefinition>;
  onAction?: IterCallback<ActionDefinition>;
}

/**
 * Iterate over an action definition and call each callback if relevant.
 *
 * If a callback returns true, the iteration is aborted.
 *
 * @param action The action definition to iterate over.
 * @param callbacks The callbacks to call if a sub definition is found.
 * @param prefix The initial path prefix. This is mainly used for nested iteration.
 * @returns True if any callback returns true, false otherwise.
 */
export function iterAction(
  action: ActionDefinition,
  callbacks: IterCallbacks,
  prefix: Prefix = [],
): boolean {
  if (callbacks.onAction?.(action, prefix)) {
    return true;
  }

  if (action.onSuccess && iterAction(action.onSuccess, callbacks, [...prefix, 'onSuccess'])) {
    return true;
  }

  if (action.onError && iterAction(action.onError, callbacks, [...prefix, 'onError'])) {
    return true;
  }

  if (action.type === 'condition') {
    return Boolean(
      iterAction(action.then, callbacks, [...prefix, 'then']) ||
        iterAction(action.else, callbacks, [...prefix, 'else']),
    );
  }

  if (action.type === 'each') {
    return iterAction(action.do, callbacks, [...prefix, 'do']);
  }

  if ('blocks' in action) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return iterBlockList(action.blocks, callbacks, [...prefix, 'blocks']);
  }

  return false;
}

/**
 * Iterate over a block definition and call each callback if relevant.
 *
 * If a callback returns true, the iteration is aborted.
 *
 * @param block The block definition to iterate over.
 * @param callbacks The callbacks to call if a sub definition is found.
 * @param prefix The initial path prefix. This is mainly used for nested iteration.
 * @returns True if any callback returns true, false otherwise.
 */
export function iterBlock(
  block: BlockDefinition,
  callbacks: IterCallbacks,
  prefix: Prefix = [],
): boolean {
  if (callbacks.onBlock?.(block, prefix)) {
    return true;
  }

  if (block.actions) {
    return Object.entries(block.actions).some(([key, action]) =>
      iterAction(action, callbacks, [...prefix, 'actions', key]),
    );
  }

  return false;
}

/**
 * Iterate over a block definition list and call each callback if relevant.
 *
 * If a callback returns true, the iteration is aborted.
 *
 * @param blockList The block definition list to iterate over.