import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { TeamPage } from './team/index.js';

export function TeamsRoutes(): ReactElement {
  useMeta(messages.title);

  return (
    <MetaSwitch>
      <Route element={<IndexPage />} path="/" />
      <Route element={<TeamPage />} path="/:teamId" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
