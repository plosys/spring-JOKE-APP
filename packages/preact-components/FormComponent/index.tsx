
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { cloneElement, ComponentChild, isValidElement, VNode } from 'preact';
import { forwardRef } from 'preact/compat';

import { Icon } from '../index.js';
import styles from './index.module.css';

/**
 * These props are typically inherited by a component that implements `FormComponent`.
 */
export interface SharedFormComponentProps {
  /**
   * An optional class name.
   */
  className?: string;

  /**
   * A Bulma addon to display.
   */
  addon?: ComponentChild;

  /**
   * An additional control node to render right of the form field.
   */
  control?: VNode;

  /**
   * An error message to render. This will also make the help text red.
   */
  error?: ComponentChild;

  /**
   * A help message to render.
   */
  help?: ComponentChild;

  /**
   * A fontawesome icon to render on the left side of the input.
   */
  icon?: IconName;

  /**
   * An optional id for the HTML element. If not set, this will fall back to `name`.
   */
  id?: string;

  /**
   * The label element to render.
   */
  label?: ComponentChild;

  /**
   * The label used for optional fields.
   *
   * @default '(Optional)'
   */
  optionalLabel?: ComponentChild;

  /**
   * The name for the HTML element.
   */
  name?: string;

  /**
   * Whether or not the field is required
   */
  required?: boolean;

  /**
   * The tag to display next to the label.
   */
  tag?: ComponentChild;

  /**
   * Combines fields on the same row.
   *
   * Fields are combined in order if set to true.
   */
  inline?: true;
}

export interface FormComponentProps extends SharedFormComponentProps {
  children: ComponentChild;

  /**
   * An extra message to display right of the help text.
   */
  helpExtra?: ComponentChild;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;

  /**
   * Whether or not the help section should be rendered.
   */
  disableHelp?: boolean;
}

/**
 * A wrapper for creating consistent form components.
 */
export const FormComponent = forwardRef<HTMLDivElement, FormComponentProps>(
  (
    {
      addon,
      children,