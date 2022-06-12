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
  const url = `/${lang}/organizations/${organizationId}`;

  const result = useData<Organization>(`/api/organizations/${organizationId}`);
  const userOrganization = organizations?.find((org) => org.id === organizationId);
  const mayEdit = userOrganization && checkRole(userOrganization.role, Permission.EditOrganization);

  useSideMenu(
    result.data && (
      <MenuSection label={<span className="ml-2">{result.data.name}</span>}>
        <MenuItem exact icon="briefcase" to={url}>
          <FormattedMessage {...messages.organization} />
        </MenuItem>
        {userOrganization ? (
          <MenuItem exact icon="users" to={`${url}/members`}>
            <FormattedMessage {...messages.members} />
          </MenuItem>
        ) : null}
        {mayEdit ? (
          <MenuItem exact icon="cog" to={`${url}/settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        ) : null}
      </MenuSection>
    ),
  );

  if (!normalized.test(organizationId)) {
    return <Navigate to={String(url.replace(organizationId, normalize(organizationId)))} />;
  }

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {(organization) => (
        <MetaSwitch title={organization.name || organizationId}>
          <Route element={<IndexPage organization={userOrganization ?? organization} />} path="/" />

          <Route
            element={
              <ProtectedRoute
                organization={userOrganization}
                permission={Permission.EditOrganization}
              />
            }
          >
            <Route
              element={
                <SettingsPage
                  onChangeOrganization={result.setData}
                  organization={userOrganization ?? organization}
                />
              }
              path="/settings"
            />
          </Route>

          {userOrganization ? (
            <Route element={<ProtectedRoute organization={userOrganization} />}>
              <Route element={<MembersPage />} path="/members" />
            </Route>
          ) : null}

          <Route element={<Navigate to={url} />} path="*" />
        </MetaSwitch>
      )}
    </AsyncDataView>
  );
}
