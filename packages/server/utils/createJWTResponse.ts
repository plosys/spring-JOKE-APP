import { TokenResponse } from '@appsemble/types';
import jwt from 'jsonwebtoken';

import { argv } from './argv.js';

interface Options {
  /**
   * The audience for which the token is intended, such as an OAuth2 client id. This defaults to the
   * host variable.
   */
  aud?: string;

  /**
   * In how much time the token will expire, in seconds.
   */
  expires?: number;

  /**
   * If explicitly set to `false`, not refresh token will be generated.
   */
  refreshToken?: boolean;

  /**
   * The scope to set on the access token and refresh token.
   */
  scope?: string;
}

/**
 * Create a JSON web token response.
 *
 * @param sub The id of the user that is authenticated using the token.
 * @param options The options for creating the JWS response.
 * @returns A JWT based OAuth2 response body.
 * @see https://www.iana.org/assignments/jwt/jwt.xhtml
 */
export function createJWTResponse(
  sub: string,
  { aud = argv.host, expires = 3600, refreshToke