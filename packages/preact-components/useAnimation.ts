import { useEffect, useState } from 'preact/hooks';

interface Classes {
  /**
   * The class to use when the element is open.
   *
   * Typically this has the following CSS:
   *
   * ```css
   * .open {
   *   opacity: 1;
   * }
   * ```
   */
  open?: string;

  /**
   * The class to use when the element is open.
   *
   * Typically this has the following CSS:
   *
   * ```css
   * .opening {
   *   opacity: 0;
   * }
   * ```
   */
  opening?: string;

  /**
   * The class to use when the element is open.
   *
   * Typically this is omitted. Otherwise this probaby has the following CSS:
   *
   * ```css
   * .closed {
   *   opacity: 0;
   * }
   * ```
   */
  closed?: string;

  /**
   * The class to use when the elemen