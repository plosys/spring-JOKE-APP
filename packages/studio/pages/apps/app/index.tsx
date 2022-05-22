import {
  Icon,
  Loader,
  MenuItem,
  MenuSection,
  Message,
  MetaSwitch,
  useData,
  useSideMenu,
} from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { compareStrings, Permission } from '@appsemble/utils';
import classNames from 'classnames';
import {
  createContext,
  Dispatch,
  lazy,
  ReactElement,
  SetStateAction,
  Suspense,
  useContext,
  useMemo,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { ProtectedRoute } from '../../../components/ProtectedRoute/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { checkRole } from '../../../utils/checkRole.js';
import { AssetsPage } from './assets/index.js';
import { DefinitionPage } from './definition/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { NotificationsPage } from './notifications/index.js';
import { ResourcesRoutes } from './resources/index.js';
import { SecretsPage } from './secrets/index.js';
import { SettingsPage } from './settings/index.js';
import { SnapshotsRoutes } from './snapshots/index.js';
import { TeamsRoutes } from './teams/index.js';
import { TranslationsPage } from './translations/index.js';
import { UsersPage } from './users/index.js';

/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
interface AppValueContext {
  /**
   * The app in the current URL context.
   */
  app: App;

  /**
   * Update the app in the current context.
   */
  setApp: Dispatch<SetStateAction<App>>;
}

const Context = createContext<AppValueContext>(null);

const EditPage = lazy(() => import('./edit/index.js'));

export function AppRoutes(): ReactElement {
  const { id, lang } = useParams<{ id: string; lang: string }>();
  const url = `/${lang}/apps/${id}`;

  const { organization