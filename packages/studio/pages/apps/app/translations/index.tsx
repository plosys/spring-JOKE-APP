import {
  Button,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { compareStrings, getLanguageDisplayName, langmap } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { AsyncDataView } from '