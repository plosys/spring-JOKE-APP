import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';

interface SubtitleProps {
  /**
   * The content to render inside the header element.
   */
  children: ReactNode;

  /**
   * An additional class name to add.
   */
  className?: string;

  /**
   * The locale of the subtitle content.
   */
  lang?: string;

  /**
   * The header level.
   *
   * Note that this should be two higher than any `title` component.
   *
   * By default this is determined from the specified size.
   */
  level?: 3 | 4 | 5 | 6;

  /**
   * The size of the header.
   *
   * @default 5
   */
  size?: 4 | 5 | 6;
}

/**
 * A bulma styled subtitle