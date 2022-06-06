import {
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  Title,
  useConfirmation,
  useData,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { Team } from '@appsemble/types';
import { Permission, TeamRole } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { TeamMember } from '../../../../../types.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { useApp } from '../../index.js';
import { AddTeamMemberModal } from './AddTeamMemberModal/index.js';
import { AnnotationsTable } from './AnnotationsTable/index.js';
import { messages } from './messages.js';
import { TeamMemberRow } from './TeamMemberRow/index.js';

export function TeamPage(): ReactElement {
  const { teamId } = useParams<{ teamId: string }>();
  const { app } = useApp();
  const { organizations, userInfo } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { formatMessage } = useIntl();

  const teamResult = useData<Team>(`/api/apps/${app.id}/teams/${teamId}`);
  useMeta(teamResult.data?.name || teamId);
  const memberResult = useData<TeamMember[]>(`/api/apps/${app.id}/teams/${teamId}/members`);
  const editModal = useToggle();
  const addModal = useToggle();

  const submitTeam = useCallback(
    async ({ annotations, name }: typeof defaultValues) => {
      const { data } = await axios.patch<Team>(`/api/apps/${app.id}/teams/${teamId}`, {
        name,
        annotations: Object.fromEntries(annotations),
      });
      editModal.disable();
      teamResult.setData(data);
    },
    [editModal, app, teamResult, teamId],
  );

  const onEdit = useCallback(
    async ({ id }: TeamMember, role: TeamRole) => {
      const { data: updated } = await axios.put<TeamMember>(
        `/api/apps/${app.id}/teams/${teamId}/members/${id}`,
        { role },
      );
      memberResult.setData((members) =>
        members.map((member) => (member.id === id ? updated : member)),
      );
    },
    [app, memberResult, teamId],
  );

  const onAdd = useCallback(
    async (id: string) => {
      const { data: newMember } = await axios.post<TeamMember>(
        `/api/apps/${app.id}/teams/${teamId}/members`,
        { id },
      );
      memberResult.setData((members) => [...members, newMember]);
      addModal.disable();
    },
    [addModal, memberResult, app, teamId],
  );

  const onDelete = useCallback(async () => {
    await axios.delete(`/api/apps/${app.id}/teams/${teamId}`);
    navigate(pathname.replace(`/teams/${teamId}`, '/teams'), { replace: true });
  }, [navigate, app, teamId, pathname]);

  const onDeleteClick = useConfirmation({
    title: <FormattedMessage {...messages.deletingTeam} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteTeam} />,
    action: onDelete,
  });

  const onRemoveTeamMember = useCallback(
    async ({ id }: TeamMember) => {
      await axios.delete(`/api/apps/${app.id}/teams/${teamId}/members/${id}`);
      memberResult.setData((members) => members.filter((member) => 