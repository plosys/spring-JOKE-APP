import { IconName } from '@fortawesome/fontawesome-common-types';
import { Schema } from 'jsonschema';
import { OpenAPIV3 } from 'openapi-types';
import { JsonObject, RequireExactlyOne } from 'type-fest';

import { Action, LogAction } from './action.js';
import { AppVisibility, TeamsDefinition } from './app.js';
import { BulmaColor } from './bulma.js';
import { HTTPMethods } from './http.js';
import { Theme } from './theme.js';

export * from './action.js';
export * from './app.js';
export * from './appMember.js';
export * from './asset.js';
export * from './authentication.js';
export * from './author.js';
export * from './bulma.js';
export * from './http.js';
export * from './snapshot.js';
export * from './resource.js';
export * from './saml.js';
export * from './ssl.js';
export * from './team.js';
export * from './template.js';
export * from './theme.js';
export * from './user.js';

/**
 * A representation of a generated OAuth2 authorization code response.
 */
export interface OAuth2AuthorizationCode {
  /**
   * The authorization code.
   */
  code: string;
}

/**
 * A block that is displayed on a page.
 */
export interface BlockDefinition {
  /**
   * The type of the block.
   *
   * A block type follow the format `@organization/name`.
   * If the organization is _appsemble_, it may be omitted.
   *
   * Pattern:
   * ^(@[a-z]([a-z\d-]{0,30}[a-z\d])?\/)?[a-z]([a-z\d-]{0,30}[a-z\d])$
   *
   * Examples:
   * - `form`
   * - `@amsterdam/splash`
   */
  type: string;

  /**
   * A [semver](https://semver.org) representation of the block version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /**
   * An optional header to render above the block.
   */
  header?: Remapper;

  /**
   * An override of the block’s default layout.
   */
  layout?: 'float' | 'grow' | 'static';

  /**
   * For floating blocks this propert defines where the block should float.
   */
  position?:
    | 'bottom left'
    | 'bottom right'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top left'
    | 'top right'
    | 'top';

  /**
   * The theme of the block.
   */
  theme?: Partial<Theme>;

  /**
   * A free form mapping of named parameters.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  parameters?: JsonObject;

  /**
   * A mapping of actions that can be fired by the block to action handlers.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  actions?: Record<string, ActionDefinition>;

  /**
   * Mapping of the events the block can listen to and emit.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  events?: {
    listen?: Record<string, string>;
    emit?: Record<string, string>;
  };

  /**
   * A list of roles that are allowed to view this block.
   */
  roles?: string[];
}

/**
 * OpenID Connect specifies a set of standard claims about the end-user, which cover common profile
 * information such as name, contact details, date of birth and locale.
 *
 * The Connect2id server can be set up to provide additional custom claims, such as roles and
 * permissions.
 */
export interface UserInfo {
  /**
   * The subject (end-user) identifier. This member is always present in a claims set.
   */
  sub: string;

  /**
   * The full name of the end-user, with optional language tag.
   */
  name: string;

  /**
   * The end-user's preferred email address.
   */
  email: string;

  /**
   * True if the end-user's email address has been verified, else false.
   */
  email_verified: boolean;

  /**
   * The URL of the profile picture for the end-user.
   */
  picture?: string;

  /**
   * A URL that links to the user profile.
   */
  profile?: string;

  /**
   * The end-user’s locale, represented as a BCP47 language tag.
   */
  locale?: string;

  /**
   * The end-user’s time zone.
   */
  zoneinfo?: string;
}

/**
 * The payload stored in our JSON web tokens
 */
export interface JwtPayload {
  aud: string;
  exp: number;
  iat: string;
  iss: string;
  scope: string;
  sub: string;
}

/**
 * A response for a login token request
 */
export interface TokenResponse {
  /**
   * The bearer access token to use for authenticating requests.
   */
  access_token: string;

  /**
   * How long until the access token expires in seconds from now.
   */
  expires_in?: number;

  /**
   * The OpenID ID token as a JWT.
   *
   * This field is only present on OpenID connect providers.
   */
  id_token?: string;

  /**
   * A refresh token for getting a new access token.
   */
  refresh_token?: string;

  token_type: 'bearer';
}

interface BaseICSRemapper {
  /**
   * The start of the icalendar event.
   */
  start: Remapper;

  /**
   * The title of the event.
   */
  title: Remapper;

  /**
   * An optional description of the event.
   */
  description?: Remapper;

  /**
   * An optional link to attach to the event.
   */
  url?: Remapper;

  /**
   * An optional location description to attach to the event.
   */
  location?: Remapper;

  /**
   * An optional geolocation description to attach to the event.
   *
   * This must be an object with the properties `lat` or `latitude`, and `lon`, `lng` or
   * `longitude`.
   */
  coordinates?: Remapper;
}

interface DurationICSRemapper extends BaseICSRemapper {
  /**
   * The duration of the event.
   *
   * @example '1w 3d 10h 30m'
   */
  duration: Remapper;
}

interface EndTimeICSRemapper extends BaseICSRemapper {
  /**
   * The end time of the event as a date or a date string.
   */
  end: Remapper;
}

export interface Remappers {
  /**
   * Get app metadata.
   *
   * Supported properties:
   *
   * - `id`: Get the app id.
   * - `locale`: Get the current locale of the app.
   * - `url`: Get the base URL of the app.
   */
  app: 'id' | 'locale' | 'url';

  /**
   * Get page metadata.
   *
   * Supported properties:
   *
   * - `data`: Get the current page data.
   * - `url`: Get the URL of the current page.
   */
  page: 'data' | 'url';

  /**
   * Get a property from the context.
   */
  context: string;

  /**
   * Convert a string to a date using a given format.
   */
  'date.parse': string;

  /**
   * Returns the current date.
   */
  'date.now': unknown;

  /**
   * Adds to a date.
   */
  'date.add': string;

  /**
   * Format a date to an iso8601 / rfc3339 compatible string.
   */
  'date.format': null;

  /**
   * Compare all computed remapper values against each other.
   *
   * Returns `true` if all entries are equal, otherwise `false`.
   */
  equals: Remapper[];

  /**
   * Get data stored at the current flow page step
   */
  step: string;

  /**
   * Compares the first computed remapper value with the second computed remapper value.
   *
   * Returns `true` of the first entry is greater than the second entry.
   */
  gt: [Remapper, Remapper];

  /**
   * Compares the first computed remapper value with the second computed remapper value.
   *
   * Returns `true` of the first entry is less than the second entry.
   */
  lt: [Remapper, Remapper];

  /**
   * Builds an array based on the given data and remappers.
   *
   * The remappers gets applied to each item in the array.
   *
   * Always returns an array, can be empty if supplied data isn’t an array.
   */
  'array.map': Remapper;

  /**
   * Filters out unique entries from an array.
   *
   * The value Remapper is applied to each entry in the array,
   * using its result to determine uniqueness.
   *
   * If the value Remapper result in `undefined` or `null`, the entire entry is used for uniqueness.
   *
   * If the input is not an array, the input is returned without any modifications.
   */
  'array.unique': Remapper;

  /**
   * Create an icalendar event.
   */
  ics: DurationICSRemapper | EndTimeICSRemapper;

  /**
   * Checks if condition results in a truthy value.
   *
   * Returns value of then if condition is truthy, otherwise it returns the value of else.
   */
  if: { condition: Remapper; then: Remapper; else: Remapper };

  /**
   * Get the current array.map’s index or length.
   *
   * Returns nothing if array.map’s context isn’t set.
   */
  array: 'index' | 'length';

  /**
   * Create a new array with an array of predefined remappers.
   */
  'array.from': Remapper[];

  /**
   * Append new values to the end of an array.
   *
   * If the input is not an array an empty array is returned.
   */
  'array.append': Remapper[];

  /**
   * Remove item(s) from an array given a predefined array of remappable indices.
   *
   * Only the remapped values that are turned into numbers are applied.
   *
   * If the input is not an array an empty array is returned.
   */
  'array.omit': Remapper[];

  /**
   * Create a new object given some predefined mapper keys.
   */
  'object.from': Record<string, Remapper>;

  /**
   * Assign properties to an existing object given some predefined mapper keys.
   */
  'object.assign': Record<string, Remapper>;

  /**
   * Remove properties from an existing object based on the given the object keys.
   *
   * Nested properties can be removed using arrays of keys.
   *
   * @example
   * ```yaml
   * object.omit:
   *   - foo   # Removes the property foo
   *   - - bar # Removes the property baz inside of bar
   *     - baz
   * ```
   */
  'object.omit': (string[] | string)[];

  /**
   * Use a static value.
   */
  static: any;

  /**
   * Get a property from an object.
   *
   * If the prop is an array, nested properties will be retrieved in sequence.
   */
  prop: number[] | string[] | number | string;

  /**
   * Recursively strip all nullish values from an object or array.
   */
  'null.strip': {
    depth: number;
  } | null;

  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.choice': null;
  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.integer': [number, number];

  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.float': [number, number];

  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.string': { choice: string; length: number };

  /**
   * Get the input data as it was initially passed to the remap function.
   */
  root: null;

  /**
   * Get the data at a certain index from the history stack prior to an action.
   *
   * 0 is the index of the first item in the history stack.
   */
  history: number;

  /**
   * Create a new object with properties from the history stack at a certain index.
   */
  'from.history': {
    /**
     * The index of the history stack item to apply.
     *
     * 0 is the index of the first item in the history stack.
     */
    index: number;

    /**
     * Predefined mapper keys to choose what properties to apply.
     */
    props: Record<string, Remapper>;
  };

  /**
   * Assign properties from the history stack at a certain index to an existing object.
   */
  'assign.history': {
    /**
     * The index of the history stack item to assign.
     *
     * 0 is the index of the first item in the history stack.
     */
    index: number;

    /**
     * Predefined mapper keys to choose what properties to assign.
     */
    props: Record<string, Remapper>;
  };

  /**
   * Assign properties from the history stack at a certain index and exclude the unwanted.
   */
  'omit.history': {
    /**
     * The index of the history stack item to assign.
     *
     * 0 is the index of the first item in the history stack.
     */
    index: number;

    /**
     * Exclude properties from the history stack item, based on the given object keys.
     *
     * Nested properties can be excluded using arrays of keys.
     *
     * @example
     * ```yaml
     * omit.history:
     *   index: 0
     *   keys:
     *     - foo   # Excludes the property foo
     *     - - bar # Excludes the property baz inside of bar
     *       - baz
     * ```
     */
    keys: (string[] | string)[];
  };

  /**
   * Convert an input to lower or upper case.
   */
  'string.case': 'lower' | 'upper';

  /**
   * Format a string using remapped input variables.
   */
  'string.format': {
    /**
     * The message id pointing to the template string to format.
     */
    messageId?: string;

    /**
     * The template default string to format.
     */
    template?: string;

    /**
     * A set of remappers to convert the input to usable values.
     */
    values?: Record<string, Remapper>;
  };

  /**
   * Match the content with the regex in the key, and replace it with its value.
   */
  'string.replace': Record<string, string>;

  /**
   * Translate using a messageID.
   *
   * This does not support parameters, for more nuanced translations use `string.format`.
   */
  translate: string;

  user: keyof UserInfo;
}

export type ObjectRemapper = RequireExactlyOne<Remappers>;

export type ArrayRemapper = (ArrayRemapper | ObjectRemapper)[];

export type Remapper = ArrayRemapper | ObjectRemapper | boolean | number | string;

export interface SubscriptionResponseResource {
  create: boolean;
  update: boolean;
  delete: boolean;
  subscriptions?: Record<
    string,
    {
      create?: boolean;
      update: boolean;
      delete: boolean;
    }
  >;
}

export type SubscriptionResponse = Record<string, SubscriptionResponseResource>;

export interface RoleDefinition {
  description?: string;
  inherits?: string[];
  defaultPage?: string;
}

export interface Security {
  default: {
    role: string;
    policy?: 'everyone' | 'invite' | 'organization';
  };

  roles: Record<string, RoleDefinition>;

  /**
   * Define how teams are handled by the app.
   */
  teams?: TeamsDefinition;
}

export type Navigation = 'bottom' | 'hidden' | 'left-menu';
export type LayoutPosition = 'hidden' | 'navbar' | 'navigation';

export interface NotificationDefinition {
  to?: string[];
  subscribe?: 'all' | 'both' | 'single';
  data?: {
    title: string;
    content: string;
    link: string;
  };
}

/**
 * A collection of hooks that are triggered upon calling a resource actions.
 */
export interface ResourceHooks {
  notification: NotificationDefinition;
}

export interface ResourceCall {
  /**
   * The HTTP method to use for making the HTTP request.
   */
  method?: HTTPMethods;

  /**
   * The URL to which to make the resource request.
   */
  url?: string;

  /**
   * The associated hooks with the resource action.
   */
  hooks?: ResourceHooks;

  /**
   * Query parameters to pass along with the request.
   */
  query?: Remapper;

  /**
   * The roles that are allowed to perform this action.
   */
  roles?: string[];
}

interface ResourceReferenceAction {
  trigger: ('create' | 'delete' | 'update')[];
}

interface ResourceReference {
  /**
   * The name of the referenced resource.
   */
  resource: string;

  create?: ResourceReferenceAction;
  update?: ResourceReferenceAction;
  delete?: ResourceReferenceAction;
}

export interface ResourceHistoryDefinition {
  /**
   * If set to `false`, edits are still tracked, but exactly what changed is lost.
   */
  data: boolean;
}

export interface ResourceView {
  /**
   * The roles required to use this view.
   */
  roles: string[];

  /**
   * The remappers used to transform the output.
   */
  remap: Remapper;
}

export interface ResourceDefinition {
  /**
   * The default list of roles used for permission checks for each action.
   */
  roles?: string[];

  /**
   * A definition of how versioning should happen for instances of this resource.
   */
  history?: ResourceHistoryDefinition | boolean;

  /**
   * The definition for the `resource.create` action.
   */
  create?: ResourceCall;

  /**
   * The definition for the `resource.delete` action.
   */
  delete?: ResourceCall;

  /**
   * The definition for the `resource.get` action.
   */
  get?: ResourceCall;

  /**
   * The definition for the `resource.query` action.
   */
  query?: ResourceCall;

  /**
   * The definition for the `resource.count` action.
   */
  count?: ResourceCall;

  /**
   * The definition for the `resource.update` action.
   */
  update?: ResourceCall;

  /**
   * The definition for the `resource.patch` action.
   */
  patch?: ResourceCall;

  /**
   * The property to use as the id.
   *
   * @default `id`
   */
  id?: string;

  /**
   * The JSON schema to validate resources against before sending it to the backend.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The URL to post the resource to.
   *
   * @default autogenerated for use with the Appsemble resource API.
   */
  url?: string;

  /**
   * The alternate views of this resource.
   */
  views?: Record<string, ResourceView>;

  /**
   * The references this resources has to other resources.
   */
  references?: Record<string, ResourceReference>;

  /**
   * A time string representing when a resource should expire.
   *
   * @example '1d 8h 30m'
   */
  expires?: string;
}

export interface BaseActionDefinition<T extends Action['type']> {
  /**
   * The type of the action.
   */
  type: T;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   *
   * @deprecated Since 0.20.10, use {@link remapBefore} instead.
   */
  remap?: Remapper;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   */
  remapBefore?: Remapper;

  /**
   * The remapper used to transfrom the output before passing it to the next action.
   */
  remapAfter?: Remapper;

  /**
   * Another action that is dispatched when the action has been dispatched successfully.
   */
  onSuccess?: ActionDefinition;

  /**
   * Another action that is dispatched when the action has failed to dispatch successfully.
   */
  onError?: ActionDefinition;
}

export interface AnalyticsAction extends BaseActionDefinition<'analytics'> {
  /**
   * The analytics event target name.
   */
  target: string;

  /**
   * Additional config to pass to analytics.
   */
  config?: Remapper;
}

export interface ConditionActionDefinition extends BaseActionDefinition<'condition'> {
  /**
   * The condition to check for.
   */
  if: Remapper;

  /**
   * The action to run if the condition is true.
   */
  then: ActionDefinition;

  /**
   * The action to run if the condition is false.
   */
  else: ActionDefinition;
}

export interface MatchActionDefinition extends BaseActionDefinition<'match'> {
  /**
   * Run another action if one of the cases is true.
   *
   * Only the first case that equals true is called.
   */
  match: {
    /**
     * The case to be matched.
     */
    case: Remapper;
    /**
     * Action to be called if the case equals true.
     */
    action: ActionDefinition;
  }[];
}

export interface DialogActionDefinition extends BaseActionDefinition<'dialog'> {
  /**
   * If false, the dialog cannot be closed by clicking outside of the dialog or on the close button.
   */
  closable?: boolean;

  /**
   * If true, the dialog will be displayed full screen.
   */
  fullscreen?: boolean;

  /**
   * Blocks to render on the dialog.
   */
  blocks: BlockDefinition[];

  /**
   * The title to show in the dialog.
   */
  title?: Remapper;
}

export interface DownloadActionDefinition extends BaseActionDefinition<'download'> {
  /**
   * The filename to download the file as. It must include a file extension.
   */
  filename: string;
}

export interface EachActionDefinition extends BaseActionDefinition<'each'> {
  /**
   * Run the actions in series instead of parallel.
   */
  serial?: boolean;
  /**
   * Run an action for each entry in an array.
   *
   * The actions are run in parallel.
   *
   * If the input is not an array, the action will be applied to the input instead.
   */
  do: ActionDefinition;
}

export interface EmailActionDefinition extends BaseActionDefinition<'email'> {
  /**
   * The recipient of the email.
   */
  to?: Remapper;

  /**
   * The name of the sender.
   *
   * The default value depends on the email server.
   */
  from?: Remapper;

  /**
   * The recipients to CC the email to.
   */
  cc?: Remapper;

  /**
   * The recipients to BCC the email to.
   */
  bcc?: Remapper;

  /**
   * The subject of the email.
   */
  subject: Remapper;

  /**
   * The body of the email.
   */
  body: Remapper;

  /**
   * The attachments to include in the email.
   *
   * The remapper must resolve to an object containing the following properties:
   *
   * - \`target\`: The asset ID or link to download contents from to add as an attachment. This is
   * mutually exclusive with \`content\`.
   * - \`content\`: The raw content to include as the file content. This is mutually exclusive with
   * \`target\`.
   * - \`filename\`: The filename to include the attachment as.
   * - \`accept\` If the target is a URL, this will be set as the HTTP \`Accept\` header when
   * downloading the file.
   *
   * If the attachment is a string, it will be treated as the target.
   */
  attachments?: Remapper;
}

export interface FlowToActionDefinition extends BaseActionDefinition<'flow.to'> {
  /**
   * The flow step to go to.
   */
  step: Remapper;
}

export interface LinkActionDefinition extends BaseActionDefinition<'link'> {
  /**
   * Where to link to.
   *
   * This should be a page name.
   */
  to: string[] | string;
}

export interface NotifyActionDefinition extends BaseActionDefinition<'notify'> {
  /**
   * The title of the notification.
   */
  title: Remapper;

  /**
   * The description of the notification.
   */
  body: Remapper;

  /**
   * To whom the notification should be sent.
   *
   * Use `all` to send the notification to all app subscribed users.
   * Or notify specific users by passing either a single user id or an array of user ids.
   *
   * Nothing is sent if the value is **not** a valid user id.
   */
  to: Remapper;
}

export interface LogActionDefinition extends BaseActionDefinition<'log'> {
  /**
   * The logging level on which to log.
   *
   * @default `info`.
   */
  level?: LogAction['level'];
}

export interface ShareActionDefinition extends BaseActionDefinition<'share'> {
  /**
   * The URL that is being shared.
   */
  url?: Remapper;

  /**
   * The main body that is being shared.
   */
  text?: Remapper;

  /**
   * The title that is being shared, if supported.
   */
  title?: Remapper;
}

export type StorageType = 'appStorage' | 'indexedDB' | 'localStorage' | 'sessionStorage';

export interface StorageAppendActionDefinition extends BaseActionDefinition<'storage.append'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The data to write to the app’s storage.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageDeleteActionDefinition extends BaseActionDefinition<'storage.delete'> {
  /**
   * The key of the entry to delete from the app’s storage.
   */
  key: Remapper;

  /**
   * The mechanism used to delete the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageSubtractActionDefinition extends BaseActionDefinition<'storage.subtract'> {
  /**
   * The key of the entry to subtract the last entry from
   */
  key: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageUpdateActionDefinition extends BaseActionDefinition<'storage.update'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The key of the item to update.
   */
  item: Remapper;

  /**
   * The data to update the specified item with.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageReadActionDefinition extends BaseActionDefinition<'storage.read'> {
  /**
   * The key of the entry to read from the app’s storage.
   */
  key: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageWriteActionDefinition extends BaseActionDefinition<'storage.write'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The data to write to the app’s storage.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface TeamInviteActionDefinition extends BaseActionDefinition<'team.invite'> {
  /**
   * The ID of the team to invite the user to.
   */
  id?: Remapper;

  /**
   * The email address of the user to invite.
   */
  email?: Remapper;
}

export interface UserLoginAction extends BaseActionDefinition<'user.login'> {
  /**
   * The email address to login with.
   */
  email: Remapper;

  /**
   * The password to login with.
   */
  password: Remapper;
}

export interface UserRegisterAction extends BaseActionDefinition<'user.register'> {
  /**
   * The email address to login with.
   */
  email: Remapper;

  /**
   * The password to login with.
   */
  password: Remapper;

  /**
   * The display name of the user.
   */
  displayName: Remapper;

  /**
   * The profile picture to use.
   *
   * This must be a file, otherwise it’s discarded.
   */
  picture?: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties?: Remapper;
}

export interface UserUpdateAction extends BaseActionDefinition<'user.update'> {
  /**
   * The email address to update.
   */
  email?: Remapper;

  /**
   * The password to update.
   */
  password?: Remapper;

  /**
   * The display name to update.
   */
  displayName?: Remapper;

  /**
   * The profile picture to update.
   *
   * This must be a file, otherwise it’s ignored.
   */
  picture?: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties?: Remapper;
}

export interface RequestLikeActionDefinition<T extends Action['type'] = Action['type']>
  extends BaseActionDefinition<T> {
  /**
   * The HTTP method to use for making a request.
   */
  method?: HTTPMethods;

  /**
   * Whether or not to proxy the request through the Appsemble proxy endpoint.
   *
   * @default true
   */
  proxy?: boolean;

  /**
   * A JSON schema against which to validate data before uploading.
   */
  schema?: OpenAPIV3.SchemaObject;

  /**
   * Query p