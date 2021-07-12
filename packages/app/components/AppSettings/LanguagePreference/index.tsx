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
    localStorage.getItem('preferredLanguage') ?? lang,
  );

  const onLanguageChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>, language: string) => {
      navigate(url.replace(preferredLanguage, language), { replace: true });
      setPreferredLanguage(language);
      localStorage.setItem('preferredLanguage', language);
    },
    [navigate, preferredLanguage, url],
  );

  return (
    <SelectField
      label={<FormattedMessage {...messages.preferredLanguage} />}
      name="preferredLanguage"
      onChange={onLanguageChange}
      required
      value={preferredLanguage}
    >
      {languages.map((language) => (
        <option key={language} value={language}>
          {getLanguageDisplayName(language)}
        </option>
      ))}
    </SelectField>
  );
}
