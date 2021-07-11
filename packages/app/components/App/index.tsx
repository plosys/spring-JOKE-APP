import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppDefinitionProvider } from '../AppDefinitionProvider/index.js';
import { AppMessagesProvider } from '../AppMessagesProvider/index.js';
import { AppRoutes } from '../AppRoutes/index.js';
import { ErrorFallback } from '../ErrorFallback/index.js';
import { MenuProvider } from '../MenuProvider/index.js';
import { PageTracker } from '../PageTracker/index.js';
import { PermissionRequest } from '../PermissionRequest/index.js';
import { ServiceWorkerRegistrationProvider } from '../ServiceWorkerRegistrationProvider/index.js';
import { UserProvider } from '../UserProvider/index.js';

interface AppProps {
  serviceWorkerRegistrationPromi