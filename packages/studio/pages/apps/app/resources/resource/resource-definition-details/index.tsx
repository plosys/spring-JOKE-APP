import { Title, useMeta } from '@appsemble/react-components';
import { ReactElement, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import { stringify } from 'yaml';

import { CodeBlock } from '../../../../../../components/CodeBlock/index.js';
import { Collapsible } from '../../../../../..