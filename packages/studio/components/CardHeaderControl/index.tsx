import { Subtitle, Title } from '@appsemble/react-components';
import { ReactElement, ReactNode } from 'react';

import styles from './index.module.css';

interface CardHeaderControlProps {
  /**
   * The title of the card. Will be wrapped in a Title component.
   */
  title: ReactNode;

  /**
   * The level to specify on the title.
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * The subtitle of the card. Will be wrapped in a Subtitle component.
   */
  subtitle: ReactNode;

  /**
   * The description of the card.
   */
  description?: string;

  /**
   * Additional elements to display within the card’s header.
   */
  details?: ReactNode;

  /**
   * The icon of the card. Will be wrapped in a figure node.
   */
  icon?: ReactNode;

  /**
   * A list of Button controls.
   */
  controls?: ReactNode;

  /**
   * The body of the content of the card.
   */
  children?: ReactNode;
}

/**
 * Display the header of a card with support for controls on the right.
 * The children of this component are included in the main card body.
 */
export function CardHeaderControl({
  children,
  controls,
  description,
  details