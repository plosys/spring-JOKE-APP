import { ActionDefinition, AppDefinition, BlockDefinition, PageDefinition } from '@appsemble/types';

import { iterAction, iterApp, iterBlock, iterBlockList, iterPage } from './iterApp.js';

describe('iterAction', () => {
  it('should call the appropriate callbacks', () => {
    const onAction = import.meta.jest.fn();
    const onBlockList = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'dialog',
      blocks: [{ type: 'list', version: '0.1.2' }],
    };

    const result = iterAction(action, { onAction, onBlockList });

