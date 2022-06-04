import { AsyncSelect, Button, useConfirmation } from '@appsemble/react-components';
import { TeamRole } from '@appsemble/utils';
import { ChangeEvent, ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { TeamMember } from '../../../../../../types.js';
import { messages } from './messages.js';

interface TeamMemberRowProps {
  member: TeamMember;
  mayInvite: boolean;
  onEdit: (member: TeamMember, role: TeamRole) => Promise<void>;
  onRemove: (member: TeamMember) => Promise<void>;
}

export function TeamMemberRow({
  mayInvite,
  member,
  onEdit,
  onRemove,
}: TeamMemberRowProps): ReactElement {
  const editRole = useCallback(
    (event: ChangeEvent, role: TeamRole) => onEdit(member, role),
    [member, onEdit],
  );
  const removeMember = useCallback(() => onRemove(member), [member, onRemove]);
  const { formatMessage } = useIntl();

  const remove = useConfirmation({
    title: <FormattedMessage {...messages.removingMember} />,
    body: <FormattedMessage {...messages.removeWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.removeMember} />,
    action: removeMember,
  });

  return (
    <tr key={member.id}>
      <td>{member.name || member.primaryEmail || member.id}</td>
      <td align="right">
        {mayInvite ? (
          <AsyncSelect name="