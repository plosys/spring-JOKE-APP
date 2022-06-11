import { MenuItem, MenuSection, MetaSwitch, useSideMenu } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import Changelog from '../../../../CHANGELOG.md';
import { Doc } from './Doc/index.js';
import { messages } from './messages.js';
import { ReferenceRoutes } from './reference/index.js';

const context = require.context('../../../../docs', true, /\.mdx?$/);

const docs = context
  .keys()
  .map((key) => {
    const { default: Component, icon, title } = context(key) as typeof import('*.md');
    return {
      Component,
      icon,
      p: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      title,
    };
  })
  .sort((a, b) => a.p.localeCompare(b.p));

function getUrl(p: string, base: string): string {
  return p === '/' ? base : `${base}/${p.replace(/\/$/, '')}`;
}

/**
 * Render the documentation in the root of the Appsemble repository.
 */
export function DocsRoutes(): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/docs`;

  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      {docs
        .filter(({ p }) => p.endsWith('/'))
        .map(({ icon, p, title }) => {
          const subRoutes = docs.filter((subRoute) => subRoute.p !== p && subRoute.p.startsWith(p));
          return [
            <MenuItem exact icon={icon} key="docs-title" to={getUrl(p, url)}>
              {title}
            </MenuItem>,
            subRoutes.length ? (
              <MenuSection key="docs-section">
                {subRoutes.map((subRoute) => (
                  <MenuItem key={subRoute.p} to={getUrl(subRoute.p, url)}>
                    {subRoute.title}
                  </MenuItem>
                ))}
              </MenuSection>
            ) : null,
          ];
        })}
      <MenuItem exact icon="book" to={`${url}/reference`}>
        <FormattedMessage {...messages.reference} />
      </MenuItem>
      <MenuSection>
        <MenuItem exact to={`${url}/r