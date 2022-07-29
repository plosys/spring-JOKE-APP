import { OpenAPIV3 } from 'openapi-types';

import { hexColor, TeamRole } from '../../constants/index.js';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps': {
    post: {
      tags: ['app'],
      description: 'Create a new app',
      operationId: 'createApp',
      parameters: [
        {
          in: 'query',
          name: 'dryRun',
          description:
            'Validate whether an app could be created without actually creating one. Must be set to ‘true’.',
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['OrganizationId', 'yaml'],
              properties: {
                domain: {
                  $ref: '#/components/schemas/App/properties/domain',
                },
                path: {
                  $ref: '#/components/schemas/App/properties/path',
                },
                visibility: {
                  $ref: '#/components/schemas/App/properties/visibility',
                },
                template: {
                  $ref: '#/components/schemas/App/properties/template',
                },
                longDescription: {
                  $ref: '#/components/schemas/App/properties/longDescription',
                },
                yaml: {
                  type: 'string',
                  description: 'The original YAML definition used to define the app.',
                