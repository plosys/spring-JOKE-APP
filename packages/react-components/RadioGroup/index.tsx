import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import { FormComponent, ValuePickerProvider } from '../index.js';

interface RadioGroupProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'label' | 'onChange' | 'value'> {
  children: ReactNode;

  /**
   * An error message to render.
   */
  error?: ReactNode;

  /**
   * The label to display above the checkbox.
   */
  label?: ReactNode;

  /**
   * This is fired when the input value has changed.
   */
  onChange: (event: ChangeEvent<HTMLInputElement>, value: any) => void;

  /**
   * The current value.
   */
  value: any;
}

export function RadioGroup({
  children,
  className,
  error,
  label,
  name,
  onChange,
  required,
  value,
}: RadioGroupProps): ReactElement {
  return (
    <FormComponent className={className} id={name} label={label} required={required}>
      <ValuePickerProvider name={name} onChange={onChange} value={value}>
        {children}
        {error ? <p className="help is-danger">{error}</p> : null}
      </ValuePickerProvider>
    </FormComponent>
  );
}
