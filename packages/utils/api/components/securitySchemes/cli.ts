import { OpenAPIV3 } from 'openapi-types';

export const cli: OpenAPIV3.OAuth2SecurityScheme = {
  type: 'oauth2',
  description: `
    OAuth2 login for client credentials.

    For example the Appsemble CLI uses this.
  `,
  flows: {
    clientCredentials: {
      tokenUrl: '/oauth2/token',
      scopes: {
        'apps:write': 'Create and update apps',
        'blocks:write': 'Register and update blocks, and publish new block versions.',
        'organizations:write': 'Create and manage organizations.',
        'resources:read': 'Read app resources on behalf of a user.',
        'resources:write': 'Modify app resources on behalf of a user.',
        'assets:write': 'Create app assets on behalf of a user.',
        'teams:read': 'Read information about the user’s teams.',
        'teams:write': 'Read information about the user’s teams.',
      },
    },
  },
};
