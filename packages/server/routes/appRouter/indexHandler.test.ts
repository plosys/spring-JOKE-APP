// eslint-disable-next-line unicorn/import-style
import crypto from 'node:crypto';

import { request, setTestApp } from 'axios-test-instance';

import { App, BlockAsset, BlockVersion, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';
import { useTestDatabase } from '../../utils/test/testSchema.js';

let requestURL: URL;

useTestDatabase(import.meta);

beforeEach(() => {
  import.meta.jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => Buffer.alloc(size));
});

beforeEach(async () => {
  await Organization.create({ id: 'test' });
  await Organization.create({ id: 'appsemble' });

  const [a00, a01, b00, b02, a10, a11, b10, b12] = await BlockVersion.bulkCreate([
    { name: 'a', OrganizationId: 'test', version: '0.0.0' },
    { name: 'a', OrganizationId: 'test', version: '0.0.1' },
    { name: 'b', OrganizationId: 'test', version: '0.0.0' },
    { name: 'b', OrganizationId: 'test', version: '0.0.2' },
    { name: 'a', OrganizationId: 'appsemble', version: '0.1.0' },
    { name: 'a', OrganizationId: 'appsemble', version: '0.1.1' },
    { name: 'b', OrganizationId: 'appsemble', version: '0.1.0' },
    { name: 'b', OrganizationId: 'appsemble', version: '0.1.2' },
  ]);
  await BlockAsset.bulkCreate([
    {
      OrganizationId: 'test',
      BlockVersionId: a00.id,
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a00.id,
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a01.id,
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a01.id,
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b00.id,
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b00.id,
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b02.id,
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b02.id,
      filename: 'b2.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a10.id,
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a10.id,
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a11.id,
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a11.id,
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b10.id,
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b10.id,
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b12.id,
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b12.id,
      filename: 'b2.css',
      content: Buffer.from(''),
    },
  ]);
  setArgv({ host: 'http://host.example', secret: 'test' });
  const server = await createServer({
    middleware(ctx, next) {
      Object.defineProperty(ctx, 'origin', { get: () => requestURL.origin });
      Object.defineProperty(ctx, 'hostname', { get: () => requestURL.hostname });
      return next();
    },
  });
  await setTestApp(server);
});

beforeEach(() => {
  import.meta.jest.useFakeTimers({ now: 0 });
  requestURL = new URL('http://app.test.host.example');
});

it('should render the index page', async () => {
  await App.create({
    OrganizationId: 'test',
    definition: {
      name: 'Test App',
      pages: [
        {
          name: 'Test Page',
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          name: 'Test Page with Flow',
          type: 'flow',
          steps: [
            {
              blocks: [
                { type: 'a', version: '0.1.0' },
                {
                  type: 'a',
                  version: '0.1.1',
                  actions: { whatever: { blocks: [{ type: '@test/b', version: '0.0.2' }] } },
                },
              ],
            },
          ],
        },
      ],
    },
    path: 'app',
    vapidPublicKey: '',
    vapidPrivateKey: '',
  });
  const response = await request.get('/');
  expect(response).toMatchInlineSnapshot(`
    HTTP/1.1 200 OK
    Content-Security-Policy: connect-src * blob: data:; default-src 'self'; font-src * data:; frame-src 'self' *.vimeo.com *.youtube.com; img-src * blob: data: http://host.example; media-src * blob: data: http://host.example; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-ZIQmAQ5kLTM8kPLxm2ZIAGxGWL4fBbf21DH0NuLeuVw=' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
    Content-Type: text/html; charset=utf-8

    {
      "data": {
        "app": {
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "test",
          "definition": {
            "name": "Test App",
            "pages": [
              {
                "blocks": [
                  {
                    "type": "@test/a",
                    "version": "0.0.0",
                  },
                  {
                    "type": "a",
                    "version": "0.1.0",
                  },
                  {
                    "type": "a",
                    "version": "0.1.0",
                  },
                ],
                "name": "Test Page",
              },
              {
                "name": "Test Page with Flow",
                "steps": [
                  {
                    "blocks": [
                      {
                        "type": "a",
                        "version": "0.1.0",
                      },
                      {
                        "actions": {
                          "whatever": {
                            "blocks": [
                              {
                                "type": "@test/b",
                                "version": "0.0.2",
                              },
                            ],
                          },
                        },
                        "type": "a",
                        "version": "0.1.1",
                      },
                    ],
                  },
                ],
                "type": "flow",
              },
            ],
          },
          "domain": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": false,
          "path": "app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "yaml": "name: Test App
    pages:
      - name: Test Page
        blocks:
          - type: "@test/a"
            version: 0.0.0
          - type: a
            version: 0.1.0
          - type: a
            version: 0.1.0
      - name: Test Page with Flow
        type: flow
        steps:
          - blocks:
              - type: a
                version: 0.1.0
              - type: a
                version: 0.1.1
                actions:
                  whatever:
                    blocks:
                      - type: "@test/b"
                        version: 0.0.2
    ",
        },
        "appUpdated": "1970-01-01T00:00:00.000Z",
        "appUrl": "http://app.test.host.example/",
        "bulmaURL": "/bulma/0.9.3/bulma.min.css?dangerColor=%23ff2800&fontFamily=Open+Sans&fontSource=google&infoColor=%23a7d0ff&linkColor=%230440ad&primaryColor=%235393ff&splashColor=%23ffffff&successColor=%231fd25b&themeColor=%23ffffff&tileLayer=https%3A%2F%2F%7Bs%7D.tile.openstreetmap.org%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png&warningColor=%23fed719",
        "faURL": "/fa/6.3.0/css/all.min.css",
        "host": "http://host.example",
        "locale": "en",
        "locales": [],
        "nonce": "AAAAAAAAAAAAAAAAAAAAAA==",
        "settings": "<script>window.settings={"apiUrl":"http://host.example","blockManifests":[{"name":"@test/a","version":"0.0.0","layout":null,"actions":null,"events":null,"files":["a0.js","a0.css"]},{"name":"@test/b","version":"0.0.2","layout":null,"actions":null,"events":null,"files":["b2.js","b2.css"]},{"name":"@appsemble/a","version":"0.1.0","layout":null,"actions":null,"events":null,"files":["a0.js","a0.css"]},{"name":"@appsemble/a","version":"0.1.1","layout":null,"actions":null,"events":null,"files":["a1.js","a1.css"]}],"id":1,"languages":["en"],"logins":[],"vapidPublicKey":"","definition":{"name":"Test App","pages":[{"name":"Test Page","blocks":[{"type":"@test/a","version":"0.0.0"},{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.0"}]},{"name":"Test Page with Flow","type":"flow","steps":[{"blocks":[{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.1","actions":{"whatever":{"blocks":[{"type":"@test/b","version":"0.0.2"}]}}}]}]}]},"showAppsembleLogin":false,"showAppsembleOAuth2Login":true,"appUpdated":"1970-01-01T00:00:00.000Z"}</script>",
        "themeColor": "#ffff