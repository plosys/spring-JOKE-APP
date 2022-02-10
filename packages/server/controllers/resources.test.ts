
import { createFormData } from '@appsemble/node-utils';
import { Resource as ResourceType } from '@appsemble/types';
import { TeamRole, uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';
import webpush from 'web-push';

import {
  App,
  AppMember,
  AppSubscription,
  Asset,
  Member,
  Organization,
  Resource,
  ResourceVersion,
  Team,
  TeamMember,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import {
  authorizeApp,
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let member: Member;
let user: User;
let originalSendNotification: typeof webpush.sendNotification;

const exampleApp = (orgId: string, path = 'test-app'): Promise<App> =>
  App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      resources: {
        testResource: {
          views: {
            testView: {
              roles: ['Reader'],
              remap: {
                'object.from': {
                  name: {
                    'string.format': {
                      template: '{id}-{foo}',
                      values: { id: { prop: 'id' }, foo: { prop: 'foo' } },
                    },
                  },
                  randomValue: 'Some random value',
                },
              },
            },
            publicView: {
              roles: ['$public'],
              remap: { 'object.assign': { public: { static: true } } },
            },
            authorView: {
              roles: ['$author'],
              remap: { 'object.assign': { author: { static: true } } },
            },
          },
          schema: {
            type: 'object',
            required: ['foo'],
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
              fooz: { type: 'string' },
              baz: { type: 'string' },
              number: { type: 'number' },
              boolean: { type: 'boolean' },
              integer: { type: 'integer' },
              object: { type: 'object' },
              array: { type: 'array' },
            },
          },
          roles: ['$public'],
          create: {
            hooks: {
              notification: {
                subscribe: 'all',
                data: {
                  title: 'This is the title of a created testResource',
                  content: [
                    {
                      'string.format': {
                        template: 'This is the created resource {id}’s body: {foo}',
                        values: { id: [{ prop: 'id' }], foo: [{ prop: 'foo' }] },
                      },
                    },
                  ],
                },
              },
            },
          },
          update: {
            hooks: {
              notification: {
                subscribe: 'both',
              },
            },
          },
        },
        testResourceB: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' }, testResourceId: { type: 'number' } },
          },
          roles: ['$public'],
          references: {
            testResourceId: {
              resource: 'testResource',
              create: {
                trigger: ['update'],
              },
            },
          },
        },
        testResourceNone: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' } },
          },
          roles: ['$none'],
        },
        testResourceAuthorOnly: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          create: { roles: ['$author'] },
          count: { roles: ['$author'] },
          delete: { roles: ['$author'] },
          get: { roles: ['$author'] },
          query: { roles: ['$author'] },
          update: { roles: ['$author'] },
        },
        secured: {
          schema: { type: 'object' },
          create: {
            roles: ['Admin'],
          },
          query: {
            roles: ['Reader'],
          },
        },
        testResourceTeam: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          get: { roles: ['$author', '$team:member'] },
          query: { roles: ['$team:member'] },
          count: { roles: ['$team:member'] },
          update: { roles: ['$team:member'] },
          create: { roles: ['$team:member'] },
          delete: { roles: ['$team:member'] },
        },
        testResourceTeamManager: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          query: { roles: ['$author', '$team:manager'] },
          update: { roles: ['$team:manager'] },
          create: { roles: ['$team:manager'] },
          delete: { roles: ['$team:manager'] },
        },
        testExpirableResource: {
          expires: '10m',
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          roles: ['$public'],
        },
        testPrivateResource: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          roles: [],
          count: {
            roles: ['$public'],
          },
        },
        testAssets: {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
              file2: { type: 'string', format: 'binary' },
              string: { type: 'string' },
            },
          },
          roles: ['$public'],
        },
        testHistoryTrue: {
          roles: ['$public'],
          history: true,
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
        testHistoryDataTrue: {
          roles: ['$public'],
          history: { data: true },
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
        testHistoryDataFalse: {
          roles: ['$public'],
          history: { data: false },
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
      },
      security: {
        default: {
          role: 'Reader',
          policy: 'invite',
        },
        roles: {
          Visitor: {},
          Reader: {},
          Admin: {
            inherits: ['Reader'],
          },
        },
      },
    },
    path,
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: orgId,
  });

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
  originalSendNotification = webpush.sendNotification;
});

beforeEach(async () => {
  import.meta.jest.useFakeTimers({ now: 0 });
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  member = await Member.create({
    UserId: user.id,
    OrganizationId: organization.id,
    role: 'Maintainer',
  });
});

afterAll(() => {
  webpush.sendNotification = originalSendNotification;
});

describe('getResourceById', () => {
  it('should be able to fetch a resource', async () => {
    const app = await exampleApp(organization.id);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should be able to fetch a resource view', async () => {
    const app = await exampleApp(organization.id);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });
    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'testView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "name": "1-bar",
        "randomValue": "Some random value",
      }
    `);
  });

  it('should be able to fetch a public resource view', async () => {
    const app = await exampleApp(organization.id);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'publicView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
        "public": true,
      }
    `);
  });

  it('should return 404 for non-existing resource views', async () => {
    const app = await exampleApp(organization.id);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });
    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'missingView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "View missingView does not exist for resource type testResource",
        "statusCode": 404,
      }
    `);
  });

  it('should check for authentication when using resource views', async () => {
    const app = await exampleApp(organization.id);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'testView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "User is not logged in.",
        "statusCode": 401,
      }
    `);
  });

  it('should check for the correct role when using resource views', async () => {
    const app = await exampleApp(organization.id);

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Visitor' });
    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { params: { view: 'testView' } },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should be able to fetch a resource you are a team member of', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      AuthorId: userB.id,
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": null,
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `,
    );
  });

  it('should not be able to fetch a resource you are not a team member of', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      AuthorId: userB.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceTeam/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be able to fetch a resources of a different app', async () => {
    const appA = await exampleApp(organization.id);
    const appB = await exampleApp(organization.id, 'app-b');

    const resource = await Resource.create({
      AppId: appA.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    const responseA = await request.get(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
    );
    const responseB = await request.get(
      `/api/apps/${appB.id}/resources/testResourceB/${resource.id}`,
    );

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should return the resource author when fetching a single resource if it has one', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      AuthorId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "bar": 1,
        "foo": "foo",
        "id": 1,
      }
    `,
    );
  });

  it('should ignore id in the data fields', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { id: 23, foo: 'foo', bar: 1 },
      AuthorId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource/${resource.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "bar": 1,
        "foo": "foo",
        "id": 1,
      }
    `,
    );
  });

  it('should not fetch expired resources', async () => {
    const app = await exampleApp(organization.id);
    const {
      data: { id },
    } = await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    const responseA = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
    );

    // The resource expires after 10 minutes.
    import.meta.jest.advanceTimersByTime(601e3);

    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
    );

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:10:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "test",
        "id": 1,
      }
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should allow organization app editors to get resources using Studio', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should not allow organization members to get resources using Studio', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to get resources using client credentials', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should not allow organization members to get resources using client credentials', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('queryResources', () => {
  it('should be able to fetch all resources of a type', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);
  });

  it('should be possible to filter properties using $select', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 'foo', fooz: 'baz', baz: 'fooz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz', bar: 'fooz', fooz: 'bar', baz: 'foo' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $select: 'id,foo,bar' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "bar": "foo",
          "foo": "bar",
          "id": 1,
        },
        {
          "bar": "fooz",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);
  });

  it('should trim spaces in $select properties', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 'foo', fooz: 'baz', baz: 'fooz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz', bar: 'fooz', fooz: 'bar', baz: 'foo' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $select: '  fooz ,    baz     ' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "baz": "fooz",
          "fooz": "baz",
        },
        {
          "baz": "foo",
          "fooz": "bar",
        },
      ]
    `);
  });

  it('should ignore unknown properties in $select', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 'foo', fooz: 'baz', baz: 'fooz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz', bar: 'fooz', fooz: 'bar', baz: 'foo' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $select: 'unknown' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {},
        {},
      ]
    `);
  });

  it('should be possible to query resources without credentials with the $none role', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      AuthorId: user.id,
      type: 'testResourceNone',
      data: { bar: 'bar' },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResourceNone`);
    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": "bar",
          "id": 1,
        },
      ]
    `,
    );
  });

  it('should be possible to query resources as author', async () => {
    const app = await exampleApp(organization.id);
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Admin' });

    await Resource.create({
      AppId: app.id,
      AuthorId: user.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      AuthorId: userB.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResourceB', data: { bar: 'baz' } });

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `,
    );
  });

  it('should only fetch resources from team members', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'baz' },
      AuthorId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'foo' },
      AuthorId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceTeam`);
    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }, { $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$author": {
            "id": Any<String>,
            "name": null,
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `,
    );
  });

  it('should only fetch resources as an author or team manager', async () => {
    const app = await exampleApp(organization.id);
    const appB = await exampleApp(organization.id, 'test-app-2');

    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const teamB = await Team.create({ name: 'Test Team 2', AppId: app.id });
    // Create a team from a different app where the user is a manager,
    // These should not be included in the result.
    const teamC = await Team.create({ name: 'Test Team different app', AppId: appB.id });

    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: teamB.id, UserId: userB.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userC.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: teamC.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: teamC.id, UserId: userC.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baz' },
      AuthorId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeamManager',
      data: { foo: 'foo' },
      AuthorId: userC.id,
    });
    await Resource.create({
      AppId: appB.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: appB.id,
      type: 'testResourceTeamManager',
      data: { foo: 'baaar' },
      AuthorId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceTeamManager`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }, { $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$author": {
            "id": Any<String>,
            "name": null,
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "foo",
          "id": 3,
        },
      ]
    `,
    );
  });

  it('should be able to limit the amount of resources', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource?$top=1`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to sort fetched resources', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    import.meta.jest.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const responseA = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo asc`,
    );
    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);

    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo desc`,
    );
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);

    const responseC = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created asc`,
    );
    expect(responseC).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);

    const responseD = await request.get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created desc`,
    );
    expect(responseD).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "foo": "baz",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to filter fields when fetching resources', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar' } });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource?$filter=foo eq 'foo'`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "foo",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to filter multiple fields when fetching resources', async () => {
    const app = await exampleApp(organization.id);
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { foo: 'bar', bar: 2 } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $filter: `contains(foo, 'oo') and id le ${resource.id}` },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 1,
          "foo": "foo",
          "id": 1,
        },
      ]
    `);
  });

  it('should be able to filter by author', async () => {
    const app = await exampleApp(organization.id);
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
      AuthorId: userB.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $filter: `$author/id eq ${userB.id}` },
    });

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": null,
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 2,
          "foo": "bar",
          "id": 2,
        },
      ]
    `,
    );
  });

  it('should be able to combine multiple functions when fetching resources', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    import.meta.jest.advanceTimersByTime(20e3);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { $filter: "contains(foo, 'oo') or foo eq 'bar'", $orderby: '$updated desc' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:20.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "bar": 2,
          "foo": "bar",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 1,
          "foo": "foo",
          "id": 1,
        },
      ]
    `);
  });

  it('should return the resource authors if it has them', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
      AuthorId: user.id,
      EditorId: user.id,
    });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) }, $editor: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "$editor": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": 1,
          "foo": "foo",
          "id": 1,
        },
      ]
    `,
    );
  });

  it('should not fetch expired resources', async () => {
    const app = await exampleApp(organization.id);
    await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });
    await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'bar',
    });

    const responseA = await request.get(`/api/apps/${app.id}/resources/testExpirableResource`);

    // The resource A expires after 5 minutes.
    import.meta.jest.advanceTimersByTime(301e3);

    const responseB = await request.get(`/api/apps/${app.id}/resources/testExpirableResource`);

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$expires": "1970-01-01T00:05:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "test",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$expires": "1970-01-01T00:10:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 2,
        },
      ]
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$expires": "1970-01-01T00:10:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 2,
        },
      ]
    `);
  });

  it('should allow organization app editors to query resources using Studio', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should not allow organization members to query resources using Studio', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to query resources using client credentials', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
      ]
    `);
  });

  it('should not allow organization members to query resources using client credentials', async () => {
    await member.update({
      role: 'Member',
    });
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:read');
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceAuthorOnly`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should make actions private by default', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testPrivateResource',
      data: { foo: 'bar' },
    });
    const response = await request.get(`/api/apps/${app.id}/resources/testPrivateResource`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "This action is private.",
        "statusCode": 403,
      }
    `);
  });

  it('should be able to fetch a resource view', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { bar: 'baz' } });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });
    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { view: 'testView' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "name": "1-bar",
          "randomValue": "Some random value",
        },
        {
          "name": "2-baz",
          "randomValue": "Some random value",
        },
        {
          "name": "3-",
          "randomValue": "Some random value",
        },
      ]
    `);
  });

  it('should be able to fetch a public resource view', async () => {
    const app = await exampleApp(organization.id);
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({ AppId: app.id, type: 'testResource', data: { bar: 'baz' } });

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { view: 'publicView' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
          "public": true,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
          "public": true,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "bar": "baz",
          "id": 3,
          "public": true,
        },
      ]
    `);
  });

  it('should return 404 for non-existing resource views', async () => {
    const app = await exampleApp(organization.id);

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });
    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { view: 'missingView' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "View missingView does not exist for resource type testResource",
        "statusCode": 404,
      }
    `);
  });

  it('should check for authentication when using resource views', async () => {
    const app = await exampleApp(organization.id);

    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { view: 'testView' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "User is not logged in.",
        "statusCode": 401,
      }
    `);
  });

  it('should check for the correct role when using resource views', async () => {
    const app = await exampleApp(organization.id);

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Visitor' });
    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResource`, {
      params: { view: 'testView' },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('countResources', () => {
  it('should be able to count all resources of a type', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const responseA = await request.get(`/api/apps/${app.id}/resources/testResource/$count`);
    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/$count`,
    );

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should apply filters', async () => {
    const app = await exampleApp(organization.id);

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
    });

    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$filter=foo eq 'baz'`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources the user has access to', async () => {
    const app = await exampleApp(organization.id);
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Reader' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'baz' },
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/$count`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      1
    `);
  });

  it('should only count resources from team members', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'baz' },
      AuthorId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResourceTeam',
      data: { foo: 'foo' },
      AuthorId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(`/api/apps/${app.id}/resources/testResourceTeam/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources from team members based on the member team filter as a member', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=member`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources from team members based on the member team filter as a manager', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=member`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should not count resources from team members based on the member team filter as not a member', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'baz' },
      AuthorId: userB.id,
    });
    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'foo' },
      AuthorId: userC.id,
    });

    authorizeApp(app);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$team=member`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should only count resources from team members based on the manager team filter as a member', async () => {
    const app = await exampleApp(organization.id);
    const team = await Team.create({ name: 'Test Team', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Member });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: { foo: 'bar' },
      AuthorId: user.id,
    });
    await Resource.create({
      AppId: app.id,