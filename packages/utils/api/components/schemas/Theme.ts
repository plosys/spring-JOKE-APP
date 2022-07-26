import { OpenAPIV3 } from 'openapi-types';

import { baseTheme, hexColor } from '../../../constants/index.js';

export const Theme: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A generic theme definition.',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    themeColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.themeColor,
      description: `The generic theme color of the app.

This is used for example in the URL bar on Android.
`,
    },
    splashColor: {
      type: 'string',
      pattern: hexColor.source,
      default: baseTheme.splashColor,
  