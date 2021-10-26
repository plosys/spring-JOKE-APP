
import classNames from 'classnames';
import { ComponentProps, JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

export interface InputProps
  extends Omit<ComponentProps<'input'>, 'label' | 'loading' | 'onChange' | 'onInput' | 'pattern'> {
  /**
   * If specified, a datalist element will be rendered to provided auto complete options.
   */
  datalist?: string[];

  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * Indicate the select box is in a loading state.
   */
  loading?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `number`, the value is a number, otherwise it is a string.
   */
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement>, value: number | string) => void;

  /**
   * A regular expression the input must match.
   */
  pattern?: RegExp | string;

  /**
   * The HTML input type.
   *
   * This may be extended if necessary.
   *
   */
  // XXX 'date' should be removed.
  type?: 'color' | 'date' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
}

/**
 * A Bulma styled form input element.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { datalist, error, loading, name, onChange, pattern, readOnly, type, id = name, ...props },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: JSX.TargetedEvent<HTMLInputElement>) => {
        const { currentTarget } = event;
        onChange(event, type === 'number' ? currentTarget.valueAsNumber : currentTarget.value);
      },
      [onChange, type],
    );

    return (
      <>
        <input
          {...props}
          className={classNames('input', {
            'has-background-white-bis': readOnly,
            'is-danger': error,
            'is-loading': loading,
          })}
          id={id}
          name={name}
          onInput={handleChange}
          pattern={pattern instanceof RegExp ? pattern.source : pattern}
          readOnly={readOnly}
          ref={ref}
          type={type}
        />
        {datalist ? (
          <datalist id={datalist ? `${id}-dataset` : null}>
            {datalist.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        ) : null}
      </>
    );
  },
);