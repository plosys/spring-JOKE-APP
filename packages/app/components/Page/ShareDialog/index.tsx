import { Button, ModalCard } from '@appsemble/react-components';
import { Dispatch, ReactElement, SetStateAction, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { ShowShareDialogParams } from '../../../types.js';
import styles from './index.module.css';
import { messages } from './messages.js';

export interface ShareDialogParams {
  shareDialogParams: ShareDialogState;
  setShareDialogParams: Dispatch<SetStateAction<ShareDialogState>>;
}

export interface ShareDialogState {
  params: ShowShareDialogParams;
  resolve: () => void;
  reject: (error: string) => void;
}

function createUrl(origin: string, params: Record<string, string>): string {
  const url = new URL(origin);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return String(url);
}

export function ShareDialog({
  setShareDialogParams,
  shareDialogParams,
}: ShareDialogParams): ReactElement {
  const rejectShareDialog = useCallback(() => {
    setShareDialogParams((old) => {
      old?.reject('Closed share dialog');
      return null;
    });
  }, [setShareDialogParams]);

  const resolveShareDialog = useCallback(() => {
    // Defer immediately setting the params to null
    // to allow for the default <a> click handler to resolve the url properly.
    setTimeout(() => {
      setShareDialogParams((old) => {
        old?.resolve();
        return null;
      });
    }, 0);
  }, [setShareDialogParams]);

  const title = shareDialogParams?.params.title