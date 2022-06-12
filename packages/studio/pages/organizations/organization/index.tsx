import {
  MenuItem,
  MenuSection,
  MetaSwitch,
  useData,
  useSideMenu,
} from '@appsemble/react-components';
import { normalize, normalized, Permission } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { AsyncDataView } from '../../../components/AsyncDataView/index.js';
import { ProtectedRoute } from '../../../components/ProtectedRoute/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { Organization } from '../../../types.js';
import { checkRole } from '../../../utils/checkRole.js';
import { IndexPage } from './IndexPage/index.js';
import { MembersPage } from './MembersPage/index.js';
import { messages } from './messages.js';
import { SettingsPage } from './SettingsPage/index.js';

/**
 * Render routes related to apps.
 */
export function OrganizationRoutes(): ReactElement {
  const { organizations } = useUser();
  const { lang, organizationId } = useParams<{ lang: string; organizationId: string }>();
  const 