
import { OpenAPIV3 } from 'openapi-types';

export const Error: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The generic error object returned by any expected API errors.',
  readOnly: true,
  additionalProperties: false,
  properties: {
    statusCode: {
      type: 'number',
      description: 'Matches the HTTP response status code.',
      example: 404,
    },
    error: {
      type: 'string',
      description: 'Matches the HTTP response status description.',
      example: 'Not Found',
    },
    message: {
      type: 'string',
      description: 'A message describing the error.',
      example: 'Entity not found',
    },
  },
};