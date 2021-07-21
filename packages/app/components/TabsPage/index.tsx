import { MetaSwitch, Tab, Tabs } from '@appsemble/react-components';
import { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, useCallback } from 'react';
import { Navigate, Route, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppMessages } from '../AppMessagesProvider/index.js';
import { BlockList } from '../BlockList/index.js';
import { TabContent } from './TabContent/index.js';

interface TabsPageProps extends Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> {
  page: TabsPageDefinition;
}

export function TabsPage({
  page,
  prefix,
  prefixIndex,
  ...blockListProps
}: TabsPageProps): ReactElement {
  const {
    '*': wildcard,
    lang,
    pageId,
  } = useParams<{ lang: string; pageId: string; '*': string }>();

  const { getAppMessage } = useAppMessages();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const onChange = useCallback((event: ChangeEvent, value: string) => navigate(value), [navigate]);

  const pageName = getAppMessage({ id: prefix, defaultMessage: page.name }).format() as string;

  return (
    <>
      <Tabs centered onChange={onChange} size="medium" value={pathname}>
        {page.tabs.map(({ name }, index) => {
 