import { ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { FormComponent, Select, SharedFormComponentProps } from '../index.js';

type SelectFieldProps = Omit<ComponentProps<typeof Select>, keyof SharedFormComponentProps> &
  SharedFormComponentProps;

/**
 * A Bulma styled form select element.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      fullWidth = true,
      className,
      help,
      label,
      requ