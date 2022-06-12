import {
  Content,
  MenuItem,
  MenuSection,
  MetaSwitch,
  useSideMenu,
} from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { AppsRoutes } from './apps/index.js';
import { ClientCredentialsPage } from './client-credentials/index.js';
import { messages } from './messages.js';
import { SocialPage } from './social/index.js';
import { UserPage } from './user/index.js';

export function SettingsRoutes(): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/settings`;

  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      <MenuItem icon="user" to={`${url}/user`}>
        <FormattedMessage {...messages.user} />
      </MenuItem>
      <MenuSection>
        <MenuItem to={`${url}/social`}>
          <FormattedMessage {...messages.socialLogin} />
        </MenuItem>
        <MenuItem to={`${url}/apps`}>
          <FormattedMessage {