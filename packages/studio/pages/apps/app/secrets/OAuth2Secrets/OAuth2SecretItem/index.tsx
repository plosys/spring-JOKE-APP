import { useToggle } from '@appsemble/react-components';
import { AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';

import { ListButton } from '../../../../../../components/ListButton/index.js';
import { useApp } from '../../../index.js';
import { OAuth2Modal } from '../OAuth2Modal/index.js';

interface OAuth2SecretItemProps {
  /**
   * Called when the provider has been updated successfully.
   *
   * @param newProvider The new provider values.
   * @param oldProvider The old provider values to replace..
   */
  onUpdated: (newProvider: AppOAuth2Secret, oldProvider: AppOAuth2Secret) => void;

  /**
   * The current provider values.
   */
  secret: AppOAuth2Secret;

  /**
   * Called when secret has been deleted successfully.
   */
  onDeleted: (secret: AppOAuth2Secret) => void;
}

/**
 * Render an OAuth2 app secret that may be updated.
 */
export functio