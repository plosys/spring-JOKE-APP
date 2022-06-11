
import { Button, Table, Title, useData, useMeta } from '@appsemble/react-components';
import { convertToCsv } from '@appsemble/utils';
import { downloadBlob } from '@appsemble/web-utils';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { useApp } from '../index.js';
import { MemberRow } from './MemberRow/index.js';
import { messages } from './messages.js';

export interface Member {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: string;
  properties?: Record<string, string>;
}

export function UsersPage(): ReactElement {
  useMeta(messages.title);
  const { lang } = useParams<{ lang: string }>();
  const { app } = useApp();
  const result = useData<Member[]>(`/api/apps/${app.id}/members`);

  const onMemberChange = (member: Member): void => {
    result.setData(result.data.map((m) => (m.id === member.id ? member : m)));
  };

  const onMemberExport = useCallback(() => {
    const csv = convertToCsv(result.data);
    downloadBlob(csv, 'members.csv');
  }, [result.data]);

  return (
    <>
      <Title>
        <FormattedMessage {...messages.users} />
      </Title>
      {app.definition.security.default.policy === 'organization' && (
        <span>
          <FormattedMessage
            {...messages.inviteOrganization}
            values={{
              link: (text) => (
                <Link to={`/${lang}/organizations/@${app.OrganizationId}`}>{text}</Link>
              ),
            }}
          />
        </span>
      )}
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noMembers} />}
        errorMessage={<FormattedMessage {...messages.memberError} />}
        loadingMessage={<FormattedMessage {...messages.loadingMembers} />}
        result={result}
      >
        {(members) => (
          <>
            <div>
              <Button icon="download" onClick={onMemberExport}>
                <FormattedMessage {...messages.export} />
              </Button>
            </div>
            <Table>
              <thead>
                <tr>
                  <th>
                    <FormattedMessage {...messages.user} />
                  </th>
                  <th>
                    <FormattedMessage {...messages.properties} />
                  </th>
                  <th className="has-text-right">
                    <FormattedMessage {...messages.role} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} onChange={onMemberChange} />
                ))}
              </tbody>
            </Table>
          </>
        )}
      </AsyncDataView>
    </>
  );
}