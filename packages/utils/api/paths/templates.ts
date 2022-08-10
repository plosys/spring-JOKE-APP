import { OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/templates': {
    get: {
      tags: ['template'],
      description: 'Fetch a list of all available templates.',
      operationId: 'getAppTemplates',
      responses: {
        200: {
          description: 'The list of all available templates.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    template: {
                      type: 'string',
                      description: 'The name of the template.',
                    },
                    description: {
                      type: 'string',
                      description: 'The description of the template.',
                    },
                    resources: {
                      type: 'boolean',
                      description: 'Whether this template supports pre-made resources',
                    },
                 