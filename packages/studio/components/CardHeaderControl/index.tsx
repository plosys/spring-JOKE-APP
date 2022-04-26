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
  details,
  icon,
  subtitle,
  title,
  titleLevel,
}: CardHeaderControlProps): ReactElement {
  return (
    <div className="card my-3">
      <div className="is-flex card-content">
        <figure className={`image is-128x128 ${styles.logo}`}>{icon}</figure>
        <div className={`is-flex ${styles.metaWrapper}`}>
          <div className={`ml-4 ${styles.meta}`}>
            <header>
              <Title className={`is-marginless ${styles.ellipsis}`} level={titleLevel}>
                {title}
              </Title>
              <Subtitle className={`is-marginless ${styles.ellipsis}`} size={4}>
                {subtitle}
              </Subtitle>
            </header>
            {description ? (
              <p className={styles.ellipsis} title={description}>
                {description}
              </p>
            ) : null}
            {details}
          </div>
          <div className={`is-flex ${styles.buttonContainer}`}>{controls}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
