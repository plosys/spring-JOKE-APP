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

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).toHaveBeenCalledWith(action.blocks, ['blocks']);
    expect(result).toBe(false);
  });

  it('should abort if the onAction callback returns true', () => {
    const onAction = import.meta.jest.fn().mockReturnValue(true);
    const onBlockList = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'dialog',
      blocks: [{ type: 'list', version: '0.1.2' }],
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should call onAction for onSuccess', () => {
    const onAction = import.meta.jest.fn();
    const onBlockList = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onSuccess: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onSuccess, ['onSuccess']);
    expect(result).toBe(false);
  });

  it('should return true if onAction returns true for onSuccess', () => {
    const onAction = import.meta.jest
      .fn()
      .mockImplementation((a, [prefix]) => prefix === 'onSuccess');
    const onBlockList = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onSuccess: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onSuccess, ['onSuccess']);
    expect(result).toBe(true);
  });

  it('should call onAction for onError', () => {
    const onAction = import.meta.jest.fn();
    const onBlockList = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onError: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onError, ['onError']);
    expect(result).toBe(false);
  });

  it('should return true if onAction returns true for onError', () => {
    const onAction = import.meta.jest
      .fn()
      .mockImplementation((a, [prefix]) => prefix === 'onError');
    const onBlockList = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'noop',
      onError: {
        type: 'noop',
      },
    };

    const result = iterAction(action, { onAction, onBlockList });

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.onError, ['onError']);
    expect(result).toBe(true);
  });

  it('should call then and else for conditional actions', () => {
    const onAction = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'condition',
      if: true,
      then: { type: 'noop' },
      else: { type: 'noop' },
    };

    const result = iterAction(action, { onAction });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onAction).toHaveBeenCalledWith(action.then, ['then']);
    expect(onAction).toHaveBeenCalledWith(action.else, ['else']);
    expect(result).toBe(false);
  });

  it('should return the return value of iterBlockList', () => {
    const onAction = import.meta.jest.fn();
    const onBlockList = import.meta.jest.fn().mockReturnValue(true);

    const action: ActionDefinition = {
      type: 'dialog',
      blocks: [{ type: 'list', version: '0.1.2' }],
    };

    const result = iterAction(action, {
      onAction,
      onBlockList,
    });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).toHaveBeenCalledWith(action.blocks, ['blocks']);
    expect(result).toBe(true);
  });

  it('should not call iterBlockList if the action has no blocks', () => {
    const onAction = import.meta.jest.fn();
    const onBlockList = import.meta.jest.fn();

    const action: ActionDefinition = {
      type: 'log',
    };

    const result = iterAction(action, {
      onAction,
      onBlockList,
    });

    expect(onAction).toHaveBeenCalledWith(action, []);
    expect(onBlockList).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});

describe('iterBlock', () => {
  it('should call the appropriate callbacks', () => {
    const onAction = import.meta.jest.fn();
    const onBlock = import.meta.jest.fn();

    const block: BlockDefinition = {
      type: 'list',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'log',
        },
      },
    };

    const result = iterBlock(block, { onAction, onBlock });

    expect(onAction).toHaveBeenCalledWith(block.actions.onClick, ['actions', 'onClick']);
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(false);
  });

  it('should abort if onBlock returns true', () => {
    const onAction = import.meta.jest.fn();
    const onBlock = import.meta.jest.fn().mockReturnValue(true);

    const block: BlockDefinition = {
      type: 'list',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'log',
        },
      },
    };

    const result = iterBlock(block, { onAction, onBlock });

    expect(onAction).not.toHaveBeenCalled();
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(true);
  });

  it('should return the return value of onAction', () => {
    const onAction = import.meta.jest.fn().mockReturnValue(true);
    const onBlock = import.meta.jest.fn();

    const block: BlockDefinition = {
      type: 'list',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'log',
        },
      },
    };

    const result = iterBlock(block, { onAction, onBlock });

    expect(onAction).toHaveBeenCalledWith(block.actions.onClick, ['actions', 'onClick']);
    expect(onBlock).toHaveBeenCalledWith(block, []);
    expect(result).toBe(true);
  });
});

describe('iterBlockList', () => {
  it('should call the appropriate callbacks', () => {
    const onBlock = import.meta.jest.fn();
    const onBlockList = import.meta.jest.fn();

    const blocks: BlockDefinition[] = [
      {
        type: 'list',
        version: '1.2.3',
        actions: {
          onClick: {
            type: 'log',
          },
        },
      },
    ];

    const result = iterBlockList(blocks, { onBlockList, onBlock });

    expect(onBlockList).toHaveBeenCalledWith(blocks, []);
    expect(onBlock).toHaveBeenCalledWith(blocks[0], [0]);
    expect(result).toBe(false);
  });

  it('should abort if onBlockList returns true', () => {
    const onBlock = import.meta.jest.fn();
    const onBlockList = import.meta.jest.fn().mockReturnValue(true);

    const blocks: BlockDefinition[] = [
      {
        type: 'list',
        version: '1.2.3',
        actions: {
          onClick: {
            type: 'log',
          },
        },
      },
    ];

    const result = iterBlockList(blocks, { onBlockList, onBlock });

    expect(onBlockList).toHaveBeenCalledWith(blocks, []);
    expect(onBlock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});

describe('iterPage', () => {
  it('should iterate over a page', () => {
    const onBlockList = import.meta.jest.fn();
    const onPage = import.meta.jest.fn();

    const page: PageDefinition = {
      name: 'Page',
      blocks: [],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.blocks, ['blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should abort if onPage returns true', () => {
    const onBlockList = import.meta.jest.fn();
    const onPage = import.meta.jest.fn().mockReturnValue(true);

    const page: PageDefinition = {
      name: 'Page',
      blocks: [],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).not.toHaveBeenCalled();
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(true);
  });

  it('should iterate a flow page', () => {
    const onBlockList = import.meta.jest.fn();
    const onPage = import.meta.jest.fn();

    const page: PageDefinition = {
      name: 'Page',
      type: 'flow',
      steps: [
        {
          name: 'Flow page 1',
          blocks: [],
        },
      ],
    };

    const result = iterPage(page, { onBlockList, onPage });

    expect(onBlockList).toHaveBeenCalledWith(page.steps[0].blocks, ['steps', 0, 'blocks']);
    expect(onPage).toHaveBeenCalledWith(page, []);
    expect(result).toBe(false);
  });

  it('should iterate a tabs page', () => {
    const onBlockList = import.meta.jest.fn();
    const onPage = import.meta.jest.fn();

    const pa