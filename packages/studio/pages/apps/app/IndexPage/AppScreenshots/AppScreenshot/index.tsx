import { Button, Modal, useConfirmation, useToggle } from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../../../index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface AppScreenshotProps {
  url: string;
  mayManageScreenshots: boolean;
}
export function AppScreenshot({ mayManageScreenshots, url }: AppScreenshotProps): ReactElement {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();
  const modal = useToggle();

  const onDeleteScreenshotClick = useConfirmation({
    title: <FormattedMessage {...messages.deleteScreenshotTitle} />,
    body: <FormattedMessage {...messages.deleteScreenshotBody} />,
    cancelLabel: <FormattedMessage {...messages.deleteCancel} />,
    confirmLabel: <FormattedMessage {...messages.deleteConfirm} />,
    async action() {
      const split = url.split('/');
      const id = split[split.length - 1];

      await axios.delete(`/api/apps/${app.id}/screenshots/${id}`);
      setApp({ ...app, screenshotUrls: app.screenshotUrls.filter((u) => u !== url) });
    },
  });

  return (
    <div className={`mr-6 ${styles.screenshotWrapper}`} key={url}>
      {mayManageScreenshots ? (
  