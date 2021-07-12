import { Button, Content, Loader, Message, useMeta, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { clearOAuth2State, loadOAuth2State } from '@appsemble/web-utils';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Navigate } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { Main } from '../Main/index.js';
import { A