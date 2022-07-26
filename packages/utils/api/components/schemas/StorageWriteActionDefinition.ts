
import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const StorageWriteActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'key', 'value'],
  properties: {
    type: {
      enum: ['storage.write'],
      description: `Write data to the app’s local storage.

For example:
\`\`\`yaml
type: storage.write
key: temp
value: { root }
storage: localStorage
remapBefore:
  object.from:
    data:
      cool data
    value:
      1
\`\`\`
      `,
    },
    key: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The key of the storage entry.',
    },
    value: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'The data to write to the storage entry.',
    },
    storage: {
      enum: ['indexedDB', 'localStorage', 'sessionStorage', 'appStorage'],
      description: 'The mechanism used to store the data.',
      default: 'indexedDB',
    },
  },
});