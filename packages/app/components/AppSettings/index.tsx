
import { Content, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { Main } from '../Main/index.js';
import { ProfileSettings } from '../ProfileSettings/index.js';
import { AppBar } from '../TitleBar/index.js';
import { useUser } from '../UserProvider/index.js';
import { AppSubscriptions } from './AppSubscriptions/index.js';
import { LanguagePreference } from './LanguagePreference/index.js';
import { messages } from './messages.js';

/**
 * Page containing all the settings configurable for an app
 */
export function AppSettings(): ReactElement {
  useMeta(messages.settings);
  const { isLoggedIn } = useUser();
  return (
    <Content padding>
      <AppBar>
        <FormattedMessage {...messages.settings} />
      </AppBar>
      <Main>
        {isLoggedIn ? <ProfileSettings /> : null}
        <LanguagePreference />
        <AppSubscriptions />
      </Main>
    </Content>
  );
}