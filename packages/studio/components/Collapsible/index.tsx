import { Button, Title, useToggle } from '@appsemble/react-components';
import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';

import styles from './index.module.css';

interface CollapsibleProps {
  /**
   * The clickable title that is used to toggle showing or hiding the content.
   */
  title: ReactElement | string;

  /**
   * The class to apply to the title.
   */
  className?: string;

  /**
   * The header level.
   *
   * By default this is determined by the size.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * The size of the title.
   *
   * @default 4
   */
  size?: 3 | 4 | 5 | 6;

  /**
   * Whether the component should start out collapsed.
   */
  collapsed?: boolean;

  /**
   * The content to display.
   */
  children: ReactNode;
}

/**
 * Display any content with a clickable header to toggle displaying or hiding it.
 */
export function Collapsible({
  children,
  className,
  collapsed: defaultValue = false,
  level = 2,
  size = 4,
  title,
}: CollapsibleProps): ReactElement {
  const collapsed = useToggle(defaultValue);

  return (
    <>
      <div className={`${styles.titleContainer} is-flex mb-5`}>
        <Button
          className={`${styles.toggle} pl-0`}
          icon={collapsed.enabled ? 'chevron-right' : 'chevron-down'}
          iconPosition="right"
          onClick={collapsed.toggle}
        >
          <Title className={classNames('mb-0', className)} level={level} size={size}>
            {title}
          </Title>
        </Button>
      </div>
      <div className={classNames(styles.list, { 'is-hidden': collapsed.enabled })}>{children}</div>
    </>
  );
}
