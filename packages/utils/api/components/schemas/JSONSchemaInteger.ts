import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from './utils.js';

export const JSONSchemaInteger = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for an integer.',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['integer'],
      description: 'The type of the JSON schema. An integer means a fractionless number.',
    },
    examples: {
      type: 'array',
      items: {
        type: 'integer',
        description: 'An example integer which is valid according to this schema.',
      },
    },
    default: {
      type: 'integer',
      description: 'The default value which is used if no value is supplied.',
    },
    enum: {
      type: 'array',
      description: 'If an enum is specified, the type can be safely removed.',
      items: {
        type: 'integer',
      },
    },
    const: {
