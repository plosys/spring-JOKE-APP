import { Loader, useQuery } from '@appsemble/react-components';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { ReactElement, useEffect } from 'react';

import { ExtendedOAuth2State } from '../../types.js';
import { oauth2Redirect } from '../../utils/oauth2Utils.js';

interface OAuth2AppCallbackProps {
  session: ExtendedOAuth2State;
}

export function OAuth2AppCallback({ session }: OAuth2AppCallbackProps): ReactElement {
  const qs = useQuery();

  useEffect(() => {
    const code = qs.get('code');
    const state = qs.get('state');
    const error = state === session.state ? qs.get('error') : 'invalid_request';
    const appRequest = new URLSearchParams(session.appRequest);

    if (error) {
      o