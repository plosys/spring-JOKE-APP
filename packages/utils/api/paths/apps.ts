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
                },
                OrganizationId: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                icon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The app icon.',
                },
                maskableIcon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The app icon.',
                },
                iconBackground: {
                  type: 'string',
                  pattern: hexColor.source,
                  description: 'The background color to use for the maskable icon.',
                },
                coreStyle: {
                  type: 'string',
                  description: 'The custom style to apply to the core app.',
                },
                sharedStyle: {
                  type: 'string',
                  description: 'The custom style to apply to all parts of app.',
                },
                screenshots: {
                  type: 'array',
                  description: 'Screenshots to showcase in the store',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
            encoding: {
              coreStyle: { contentType: 'text/css' },
              sharedStyle: { contentType: 'text/css' },
              icon: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
              screenshots: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The app that was created.',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
    get: {
      tags: ['app'],
      parameters: [
        {
          name: 'language',
          schema: { type: 'string' },
          description: 'The language to include the translations of, if available',
          in: 'query',
        },
      ],
      description: 'Get all existing apps.',
      operationId: 'queryApps',
      responses: {
        200: {
          description: 'The list of all apps.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/App',
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, {}],
    },
  },
  '/api/apps/{appId}': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      parameters: [
        {
          name: 'language',
          schema: { type: 'string' },
          description: 'The language to include the translations of, if available',
          in: 'query',
        },
      ],
      description: 'Get a single app',
      operationId: 'getAppById',
      responses: {
        200: {
          description: 'The app that matches the given id.',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, {}],
    },
    patch: {
      tags: ['app'],
      description: 'Update parts of an existing app',
      operationId: 'patchApp',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
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
                force: {
                  type: 'boolean',
                  description: 'Whether the locked property should be ignored.',
                },
                yaml: {
                  type: 'string',
                  description: 'The original YAML definition used to define the app.',
                },
                icon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The app icon.',
                },
                maskableIcon: {
                  type: 'string',
                  format: 'binary',
                  description: 'The app icon.',
                },
                iconBackground: {
                  type: 'string',
                  pattern: hexColor.source,
                },
                coreStyle: {
                  type: 'string',
                  description: 'The custom style to apply to the core app.',
                },
                sharedStyle: {
                  type: 'string',
                  description: 'The custom style to apply to all parts of app.',
                },
                screenshots: {
                  type: 'array',
                  description: 'Screenshots to showcase in the store',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                },
                showAppsembleLogin: {
                  type: 'boolean',
                  description: 'Whether the Appsemble login method should be shown.',
                },
                showAppsembleOAuth2Login: {
                  type: 'boolean',
                  description: 'Whether the Appsemble OAuth2 login method should be shown.',
                },
                emailName: {
                  type: 'string',
                  description: 'The name used for emails.',
                },
                emailHost: {
                  type: 'string',
                  description: 'The hostname of the SMTP server.',
                },
                emailPassword: {
                  type: 'string',
                  description:
                    'The password to use for SMTP authentication. This gets encrypted when stored.',
                },
                emailUser: {
                  type: 'string',
                  description: 'The username used to authenticate against the SMTP server.',
                },
                emailPort: {
                  type: 'string',
                  description: 'The port used for the SMTP server.',
                },
                emailSecure: {
                  type: 'boolean',
                  description: 'Whether TLS is being used.',
                },
              },
            },
            encoding: {
              coreStyle: { contentType: 'text/css' },
              sharedStyle: { contentType: 'text/css' },
              icon: {
                contentType: 'image/png,image/jpeg,image/tiff,image/webp',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated app.',
          $ref: '#/components/responses/app',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
    delete: {
      tags: ['app'],
      description: 'Delete an existing app',
      operationId: 'deleteApp',
      responses: {
        204: {
          description: 'The app was successfully deleted.',
        },
      },
      security: [{ studio: [] }],
    },
  },
  '/api/apps/{appId}/lock': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['app'],
      description: 'Update the locked property an app.',
      operationId: 'setAppLock',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['locked'],
              properties: {
                locked: {
                  $ref: '#/components/schemas/App/properties/locked',
                  description: 'Whether the app should be locked.',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description: 'Lock status successfully changed',
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/apps/{appId}/email': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['app'],
      description: 'Get the app’s email settings.',
      operationId: 'getAppEmailSettings',
      responses: {
        200: {
          description: 'The current app email 