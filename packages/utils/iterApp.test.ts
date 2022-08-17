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

    expect(onAction).toHaveBeenCalledWith(ac