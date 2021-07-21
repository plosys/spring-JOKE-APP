import { useLocationString } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { useUser } from '../UserProvider/index.js';
import { TeamInvitePrompt } from './TeamInvitePrompt/index.js';

export function TeamInvite(): ReactElement {
  const { isLoggedIn } = useUser();
  const redirect = useLocationString();
  const { lang } = useParams<{ lang: string }>();

  if (!isLoggedIn) {
    return (
      <Navigate
        to={{ pathname: `/${lang}/Login`, search: String(new URLSearchParams({ redirect })) }}
      />
    );
  }

  return <TeamInvitePrompt />;
}
