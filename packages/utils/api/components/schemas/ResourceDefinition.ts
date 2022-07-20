import { OpenAPIV3 } from 'openapi-types';

const roles: OpenAPIV3.ArraySchemaObject = {
  type: 'array',
  description: `The list of roles that are allowed to use this action.

This will override the default roles that are assigned.
`,
  items: {
    type: 'string',
  },
};

const query: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The query parameters to use in the request.',
  additionalProperties: { type: 'string' },
};

const referenceAction: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  // XXX
  description: 'To be documented.',
  properties: {
    trigger: {
      type: 'array',
      items: { enum: ['create', 'update', 'delete'] },
      minItems: 1,
      uniqueItems: true,
    },
  },
};

export const ResourceDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'A definition of how this resource works.',
  required: ['schema'],
  properties: {
    expires: {
      type: 'string',
      description: `A time string representing when a resource should expire.

Example: 1d 8h 30m
`,
      pattern:
        /^(\d+(y|yr|years))?\s*(\d+months)?\s*(\d+(w|wk|weeks))?\s*(\d+(d|days))?\s*(\d+(h|hr|hours))?\s*(\d+(m|min|minutes))?\s*(\d+(s|sec|seconds))?$/
          .source,
    },
    schema: {
      $ref: '#/components/schemas/JSONSchemaRoot',
      description: 'JSON schema definitions that may be used by the app.',
    },
    references: {
      type: 'object',
      description: `References to other resources.

The key is the property that references the other resource. The value is an object describing the
name of the resource and how it should behave.
`,
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        description: 'A reference to between two resource types.',
        additionalProperties: false,
        properties: {
          resource: { type: 'string' },
          create: referenceAction,
          update: referenceAction,
          delete: referenceAction,
        },
      },
    },
    roles: {
      type: 'array',
      description: 'The default roles that are allowed to perform all actions.',
      items: { type: 'string' },
    },
    url: {
      type: 'string',
      default: '/api/apps/{appId}/{resource}',
      description: 'URL to use if not otherwise specified.',
    },
    id: {
      type: 'string',
      default: 'id',
      description: 'Name of the field used when accessing singular entities.',
    },
    history: {
      description: 'A definition of how versioning should happen for instances of this resource.',
      default: false,
      oneOf: [
        {
          type: 'boolean',
          description:
            'Setting this to `true` is the same as using an object with the property `data` set to `true`.',
        },
        { $ref: '#/components/schemas/ResourceHistoryDefinition' },
      ],
    },
    query: {
      type: 'object',
      description: "Overrides for 'query' requests.",
      additionalProperties: fals