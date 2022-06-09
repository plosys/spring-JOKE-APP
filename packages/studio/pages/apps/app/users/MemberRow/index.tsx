import {
  AsyncSelect,
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Title,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUser } from '../../../../../components/UserProvider/index.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { useApp } from '../../index.js';
import { AnnotationsTable } from '../../teams/team/AnnotationsTable/index.js';
import { Member } from '../index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface MemberRowProperties {
  member: Member;
  onChange: (member: Member) => void;
}

export function MemberRow({ member, onChange }: MemberRowProperties): ReactElement {
  const { app } = useApp();
  const { organizations, userInfo } = useUser();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const editModal = useToggle();

  const organization = organizations?.find((org) => org.id === app?.OrganizationId);
  const editRolesPermission = checkRole(organization.role, Permission.ManageRoles);

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>): Promise<void> => {
      event.preventDefault();
      const { value: role } = event.currentTarget;

      try {
        const { data } = await axios.post<Member>(`/api/apps/${app.id}/members/${member.id}`, {
          role,
        });

        push({
          color: 'success',
          body: formatMessage(messages.changeRoleSuccess, {
            name: data.name || data.primaryEmail || data.id,
            role,
          }),
        });
        onChange(data);
      } catch {
        push({ body: formatMessage(messages.changeRoleError) });
      }
    },
    [app, formatMessage, member, onChange, push],
  );

  const defaultValues = useMemo(
    () => ({
      annotations: Object.entries(member.properties || {}),
    }),
    [member],
  );

  const editProperties = useCallback(
    async ({ annotations }: typeof defaultValues) => {
      const { data } = await axios.post<Member>(`/api/apps/${app.id}/members/${member.id}`, {
        role: member.role,
        properties: Object.fromEntries(annotations),
      });
      editModal.disable();
      onChange(data);
    },
    [app, member, editModal, onChange],
  );

  return (
    <>
      <tr key={member.id}>
        <td className={styles.noWrap}>
          <span>
            {member.name
              ? member.primaryEmail
                ? `${member.name} (${member.primaryEmail})`
                : member.name
              : member.primaryEmail || member.id}
          </span>
          <div className="tags is-inline ml-2">
            {member.id === userInfo.sub && (
              <span className="tag is-success">
                <FormattedMessage {...messages.you} />
              </span>
            )}
          </d