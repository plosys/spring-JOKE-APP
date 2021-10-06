import fa from '@fortawesome/fontawesome-free/package.json';
import bulma from 'bulma/package.json';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    export interface Chainable {
      /**
       * Perform a login in Appsemble Studio using a user flow.
       *
       * @param redirect 