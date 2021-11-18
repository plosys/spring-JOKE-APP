import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement, useRef } from 'react';

import { useScrollTo } from '../useScrollTo.js';
import styles from './index.module.css';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingComponentType = `h${Level}`;

interface TitleProps extends ComponentPropsWithoutRef<HeadingComponentType> {
  /**
   * If the title has a title and `anchor` is true, an anchor will be rendered.
   */
  anchor?: boolean;

  /**
   * The header level.
   *
   * By default this is determined from the specified size.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * The size of the header.
   *
   * @default 3
   */
  size?: 3 | 4 | 5 | 6;
}

/**
 * A bulma styled title element.
 */
export function Title({
  anchor,
  children,
  className,
  id,
  size = 3,
  level = (size - 2) as TitleProps['size'],
  ...props
}: TitleProps): ReactElement {
  const ref = useRef<HTMLHeadingElement>();

  useScrollTo(ref);

  const Component = `h${level}` as HeadingComponentType;

  return (
    <Component
      className={classNames(`title is-${size}`, styles.root, className)}
      id={id}
      ref={ref}
      {...props}
    >
      {id && anchor ? (
        <a className={styles.anchor} href={`#${id}`}>
          <span className={`fas fa-link fa-xs has-text-grey-lighter mr-${size}`} />
        </a>
      ) : null}
      {children}
    </Component>
  );
}
