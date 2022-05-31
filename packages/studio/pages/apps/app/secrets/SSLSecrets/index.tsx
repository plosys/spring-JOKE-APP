import {
  Button,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  TextAreaField,
  useData,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
imp