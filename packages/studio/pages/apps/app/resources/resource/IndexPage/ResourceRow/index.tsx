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
   * Whether the checkbox for t