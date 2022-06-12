import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { ActionPage } from './action/index.js';
import { AppPage } from './app/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { RemapperPage } from './remapper/index.js';

export function ReferenceRoutes(): ReactElement {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<AppPage />} path="/app" />
      <Route element={<ActionPage />} path="/action" />
      <Route element={<RemapperPage />} path="/remapper" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
