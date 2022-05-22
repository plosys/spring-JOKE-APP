import { Button, Title, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { AppIcon } from '../../../../components/AppIcon/index.js';
import { CardHeaderControl } from '../../../../components/CardHeaderControl/index.js';
import { CloneButton } from '../../../../components/CloneButton/index.js';
import { CodeBlock } from '../../../../components/CodeBlock/index.js';
import { getAppUrl } from '../../../../utils/getAppUrl.js';
import { useApp } from '../index.js';
import { messages } from './messages.js';

/**
 * A page for viewing the source code of an app definition.
 */
export function DefinitionPage(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  useMeta(messages.title, formatMessage(messages.description, { appName: app.definition.name }));
  const { lang } = useParams<{ lang: string }>();

  return (
    <main>
      <CardHeaderControl
        controls={
          <>
            <Button
              className="mb-3 ml-4"
              color="primary"
              component="a"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </Button>
            <CloneButton app={app} />
          </>
        }
        description={app.definition.description}
        icon={<AppIcon app={app} />}
        subtitle={
          <Link to={`/${lang}/organizations/${app.OrganizationId}`}>
            {app.Organiza