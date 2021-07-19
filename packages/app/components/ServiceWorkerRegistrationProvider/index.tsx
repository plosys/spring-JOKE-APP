import { urlB64ToUint8Array } from '@appsemble/web-utils';
import axios from 'axios';
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Permission, ServiceWorkerRegistrationContextType } from '../../types.js';
import { apiUrl, appId, vapidPublicKey } from '../../utils/settings.js';

interface ServiceWorkerRegistrationProviderProps {
  children: ReactNode;
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

const Context = createContext<ServiceWorkerRegistrationContextType>(null);

export function useServiceWorkerRegistration(): ServiceWorkerRegistrationContextType {
  return useContext(Context);
}

export function ServiceWorkerRegistrationProvider({
  children,
  serviceWorkerRegistrationPromise,
}: ServiceWorkerRegistrationProviderProps): ReactElement {
  const [permission, setPermission] = useState<Permission>(window.Notification?.permission);
  const [subscription, setSubscription] = useState<PushSubscription>();

  useEffect(() => 