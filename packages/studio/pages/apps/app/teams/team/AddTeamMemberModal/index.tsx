
import {
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Toggle,
  useData,
} from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { AsyncDataView } from '../../../../../../components/AsyncDataView/index.js';
import { Member, TeamMember } from '../../../../../../types.js';
import { useApp } from '../../../index.js';
import { messages } from './messages.js';

interface AddTeamMemberModalProps {
  teamMembers: TeamMember[];
  toggle: Toggle;
  onAdd: (id: string) => Promise<void>;
}

export function AddTeamMemberModal({
  onAdd,
  teamMembers,
  toggle,
}: AddTeamMemberModalProps): ReactElement {
  const { app } = useApp();
  const result = useData<Member[]>(`/api/apps/${app.id}/members`);
  const onSubmit = useCallback(({ memberId }: typeof defaultValues) => onAdd(memberId), [onAdd]);

  const defaultValues = {
    memberId: result?.data?.find((member) => !teamMembers.map((tm) => tm.id).includes(member.id))
      ?.id,
  };

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={defaultValues}
      footer={
        <SimpleModalFooter
          allowPristine={false}
          cancelLabel={<FormattedMessage {...messages.cancel} />}
          onClose={toggle.disable}
          submitLabel={<FormattedMessage {...messages.addMember} />}
        />
      }
      isActive={toggle.enabled}
      onClose={toggle.disable}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.addingMember} />}
    >
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noMembers} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(members) => (
          <SimpleFormField
            component={SelectField}
            defaultValue={members?.[0]?.id}
            label={<FormattedMessage {...messages.member} />}
            name="memberId"
            required
          >
            {members
              .filter((member) => !teamMembers.map((tm) => tm.id).includes(member.id))
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.primaryEmail || member.id}
                </option>
              ))}
          </SimpleFormField>
        )}
      </AsyncDataView>
    </ModalCard>
  );
}