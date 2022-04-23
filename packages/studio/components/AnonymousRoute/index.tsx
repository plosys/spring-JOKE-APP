import { useQuery } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

import { useUser } from '../UserProvider/index.js';

/**
 * Render a route that is only available if the user is not logged in.
 *
 * If the user is logged in, the user is redirected to the URL specified in the `redirect` search
 * parameter, which defaults to `/apps`.
 */
export function AnonymousRoute(): ReactElement {
  const { userInfo } = useUser();
  const qs = useQuery();
  const { lang } = useParams<{ lang: string }>();

  return userInfo ? <Navigate to={qs.get('redirect') || `/${lang}/apps`} /> : <Outlet />;
}
