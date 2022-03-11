import { Remapper } from '@appsemble/types';
import { IconName } from '@fortawesome/fontawesome-common-types';

export interface OAuth2Preset {
  /**
   * The URL to which the user should be redirected in order to login.
   */
  authorizationUrl: string;

  /**
   * The Font Awesome icon that will be rendered on the login button.
   */
  icon: IconName;

  /**
   * The name that will be rendered as the button label.
   */
  name: string;

  /**
   * The scopes to request as a space separated string.
   */
  scope: string;

  /**
   * The URL from which access tokens are requested.
   */
  tokenUrl: string;

  /**
   * The URL from which user information can be retrieved following the OpenID Connect standard.
   */
  userInfoUrl?: st