import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, useCallback, useState } from 'react';

import { Select } from '../Select/index.js';

interface AsyncSelectProps extends ComponentPropsWithoutRef<typeof Select> {
  /**
   * The asynchronous action to perform when the value has changed.
   */
  onChange: (event: ChangeEvent<HTMLSelectElement>, value: string) => Promise<void>;
}

/**
 * A select box which when changed, goes into a loading state, performs an asynchronous action, and
 * goes out of the loading state when the action has finished.
 */
export function AsyncSelect({ disabled, onChange, ...props }: AsyncSelectProps): ReactElement {
  const [isBusy, set