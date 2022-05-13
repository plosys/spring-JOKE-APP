import { Content, InputField, SelectField } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useUser } from '../../../components/UserProvider/index.js';
import { CollapsibleAppList } from './CollapsibleAppList/index.js';
import { CreateAppButton } from './CreateAppButton/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

const sortFunctions = {
  organization: (a: App, b: App) => a.OrganizationId.localeCompare(b.OrganizationId),
  rating(a: App, b: App) {
    const ratingA = a.rating ?? { average: 0, count: 0 };
    const ratingB = b.rating ?? { average: 0, count: 0 };

    return ratingA.average === ratingB.average
      ? ratingA.count - ratingB.count
      : ratingA.average - ratingB.average;
  },
  $created: (a: App, b: App) => a.$created.localeCompare(b.$created),
  $updated: (a: App, b: App) => a.$updated.localeCompare(b.$updated),
  name: (a: App, b: App) => a.definition.name.localeCompare(b.definition.name),
};

export function IndexPage(): ReactElement {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ name: keyof typeof sortFunctions; reverse: boolean }>({
    name: 'rating',
    reverse: true,
  });
  const { formatMessage } = useIntl();
  const { userInfo } = useUser();
  const { lang } = useParams<{ lang: string }>();

  const onFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.currentTarget.value);
  }, []);

  const onSortChange = useCallback(
    ({ currentTarget: { value } }: ChangeEvent<HTMLSelectElement>): void => {
      const [name, direction] = value.split('.');
      setSort({ name: name as keyof typeof sortFunctions, reverse: direction === 'desc' });
    },
    [],
  );

  return (
    <Content className={styles.content} main>
      <div className="is-flex">
        <InputField
          className="mr-4 mb-0"
          icon="search"
          name="search"
          onChange={onFilterChange}
          placeholder={formatMessage(messages.search)}
          type="search"
        />
        <SelectField className="mb-0" icon="sort" name="sort" onChange={onSortChange}>
          <option hidden>{formatMessage(messages.sort)}</option>
          <option value="rating.asc">
            {`${formatMessage(messages.ratings)} (${formatMessage(messages.ascending)})`}
          </option>
          <option value="rating.desc">
            {`${formatMessage(messages.ratings)} (${formatMessage(messages.descending)})`}
          </option>
          <option value="name.asc">
            {`${formatMessage(messages.name)} (${formatMessage(messages.ascending)})`}
          </option>
          <option value="name.desc">
            {`${formatMessage(messages.name)} (${formatMessage(messages.descending)})`}
          </option>
          <option value="organization.