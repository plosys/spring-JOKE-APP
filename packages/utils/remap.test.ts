
import { AppMessages, Remapper, UserInfo } from '@appsemble/types';

import { IntlMessageFormat } from './intl-messageformat.js';
import { remap } from './remap.js';

interface TestCase {
  input: any;
  mappers: Remapper;
  expected: any;
  messages?: AppMessages['messages'];
  userInfo?: UserInfo;
  context?: Record<string, any>;