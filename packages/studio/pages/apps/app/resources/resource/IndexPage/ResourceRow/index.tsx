import {
  AsyncCheckbox,
  Button,
  CardFooterButton,
  Checkbox,
  Dropdown,
  Form,
  ModalCard,
  useConfirmation,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { Resource } from '@appsemble/types';
import { has } from '@appsemble/utils';
import { NamedEvent, serializeResource } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import { OpenAPIV3 } from 'openapi-types';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { JSONSchemaEditor } from '../../../../../../../components/JSONSchemaEditor/index.js';
import { useApp } from '../../../../index.js';
import { ResourceCell } from '../ResourceCell/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface ResourceRowProps {
  /**
   * Whether or not the dropdown for actions should be up.
   */
  dropdownUp: boolean;

  /**
   * The resource to display the data of.
   */
  resource: Resource;

  /**
   * The callback for when an existing resource is edited.
   */
  onEdit: (resource: Resource) => void;

  /**
   * The callback for when an existing resource is deleted.
   */
  onDelete: (id: number) => void;

  /**
   * The JSON schema of the resource.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * Whether the checkbox for this resource row is selected.
   */
  selected: boolean;

  /**
   * A callback function that is triggered when the checkbox is changed.
   */
  onSelected: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;

  /**
   * The list of properties to hide.
   */
  filter: Set<string>;
}

const filteredKeys = new Set(['id', '$author']);

/**
 * Display a resource in a table row.
 */
export function ResourceRow({
  dropdownUp,
  filter,
  onDelete,
  onEdit,
  onSelected,
  resource,
  schema,
  selected,
}: ResourceRowProps): ReactElement {
  const {
    id: appId,
    lang,
    resourceName,
  } = useParams<{
    lang: string;
    id: string;
    resourceName: string;
  }>();
  const url = `/${lang}/apps/${appId}/resources/${resourceName}`;
  const { app } = useApp();
  const [editingResource, setEditingResource] = useState<Record<string, unknown>>();
  const modal = useToggle();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const onSetClonable = useCallback(async () => {
    const { $author, $clonable, $created, $updated, ...rest } = resource;
    const { data } = await axios.put<Resource>(
      `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
      {
        ...rest,
        $clonable: !$clonable,
      },
    );
    onEdit(data);
  }, [appId, onEdit, resource, resourceName]);

  const openEditModal = useCallback(() => {
    modal.enable();
    const { $author, $clonable, $created, $updated, id, ...rest } = resource;
    setEditingResource(rest);
  }, [modal, resource]);

  const closeEditModal = useCallback(() => {
    modal.disable();
    setEditingResource(null);
  }, [modal]);

  const onEditChange = useCallback((event: NamedEvent, value: Resource) => {
    setEditingResource(value);
  }, []);

  const onEditSubmit = useCallback(async () => {
    try {
      const { data } = await axios.put<Resource>(
        `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
        serializeResource(editingResource),
      );
      push({
        body: formatMessage(messages.updateSuccess, { id: resource.id }),
        color: 'primary',
      });
      onEdit(data);
      closeEditModal();
    } catch {
      push(formatMessage(messages.updateError));
    }
  }, [
    appId,
    closeEditModal,
    editingResource,
    formatMessage,
    onEdit,
    push,
    resource.id,
    resourceName,
  ]);

  const onConfirmDelete = useCallback(
    () =>
      axios
        .delete(`/api/apps/${appId}/resources/${resourceName}/${resource.id}`)
        .then(() => {
          push({
            body: formatMessage(messages.deleteSuccess, { id: resource.id }),
            color: 'primary',
          });
          onDelete(resource.id);
        })
        .catch(() => push(formatMessage(messages.deleteError))),
    [appId, formatMessage, onDelete, push, resource, resourceName],
  );

  const handleDeleteResource = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelButton} />,
    confirmLabel: <FormattedMessage {...messages.deleteButton} />,
    action: onConfirmDelete,
  });

  return (
    <tr className={styles.root}>
      {!filter.has('$actions') && (
        <td className={`is-flex is-paddingless ${styles.actionCell}`}>
          <Checkbox
            className={`px-2 py-2 is-inline-block ${styles.boolean}`}
            name={String(resource.id)}
            onChange={onSelected}
            value={selected}
          />
          <Dropdown
            className={classNames(styles.dropdown, { 'is-up': dropdownUp })}
            dropdownIcon="ellipsis-v"
            label=""
          >
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              icon="pen"
              onClick={openEditModal}
            >
              <FormattedMessage {...messages.edit} />
            </Button>
            <hr className="dropdown-divider" />
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              component={Link}
              icon="book"
              to={`${url}/${resource.id}`}
            >
              <FormattedMessage {...messages.details} />
            </Button>
            <hr className="dropdown-divider" />
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              color="danger"
              icon="trash-alt"
              