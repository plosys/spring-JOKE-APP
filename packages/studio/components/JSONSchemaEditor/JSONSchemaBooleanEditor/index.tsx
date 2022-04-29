import { CheckboxField } from '@appsemble/react-components';
import { ReactElement } from 'react';

import { MarkdownContent } from '../../MarkdownContent/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaBooleanEditor({
  disabled,
  name,
  onChange,
  prefix,
  r