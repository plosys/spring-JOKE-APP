import { useObjectURL, useSimpleForm } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface PicturePreviewProps {
  /**
   * The URL to the current picture.
   */
  pictureUrl: string;
}

export function PicturePreview({ pictureUrl }: