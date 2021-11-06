import { BulmaColor } from '@appsemble/types';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { MouseEventHandler, ReactElement, ReactNode } from 'react';

import { Icon } from '../index.js';
import styles from './index.module.css';

interface MenuButtonItemProps {
  /**
   * The title text to apply to the button.
   */
  title?: string;

  /**
   * Child navigation items to render.
   */
  children?: ReactNode;

  /**
   * Whether or not this menu item is a child.
   */
  isChild?: boolean;

  /**
   * The icon to render.
   */
  icon?: IconName;

  /**
   * The color for the icon.
   */
  iconColor?: BulmaColor;

  /**
   * Click handler for the menu item.
   */
  onClic