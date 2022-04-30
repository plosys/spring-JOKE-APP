import {
  DateTimeField,
  FileUpload,
  InputField,
  PasswordField,
  TextAreaField,
} from '@appsemble/react-components';
import { OpenAPIV3 } from 'openapi-types';
import { ReactElement } from 'react';

import { MarkdownContent } from '../../MarkdownContent/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaStringEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<string>): ReactElement {
  const { description, example, format, maxLength, minLength, multipleOf } =
    schema as OpenAPIV3.SchemaObject;

  const commonProps = {
    disabled,
    help: <MarkdownContent content={description} />,
    label: <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />,
    maxLength,
    minLength,
    name,
    placehold