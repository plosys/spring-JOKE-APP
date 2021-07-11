import { SelectField } from '@appsemble/react-components';
import { getLanguageDisplayName } from '@appsemble/utils';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import { languages } from '../../../utils/settings.js';
import { messages } from './messages.js';

export function LanguagePreference(): ReactElement {
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/Settings`;

  const [preferredLanguage, setPreferredLanguage] = useState(
    localStorage.ge