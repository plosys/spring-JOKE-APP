import { Message, MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { useApp } from '../../index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { ResourceDefinitionDetailsPage } from './resource-definition-details/index.js';
import { ResourceDetailsPage } from './resource-details/index.js';

export function ResourceRoutes(): ReactElement {
  const { app } = useApp();
  const { resourceName } = useParams<{ resourceName: string }>();

  const definition = app?.definition?.resources?.[resourceName];

  if (!definition) {
    return (
      <Message color="warning">
        <Formatte