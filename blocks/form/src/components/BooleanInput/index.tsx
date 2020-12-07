
import { FormattedMessage, useBlock } from '@appsemble/preact';
import { CheckboxField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';

import { BooleanField, InputProps } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';

type BooleanInputProps = InputProps<boolean, BooleanField>;

/**
 * An input element for a boolean value.
 */
export function BooleanInput({
  className,
  dirty,
  disabled,
  error,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: BooleanInputProps): VNode {
  const { utils } = useBlock();
  const { color, icon, inline, label, labelText, size, switch: switchType, tag } = field;

  const value = getValueByNameSequence(name, formValues);
  const checkboxLabel = utils.remap(label, value);
  const required = isRequired(field);

  return (
    <CheckboxField
      className={classNames('appsemble-boolean', className, { 'is-danger': error })}
      color={color}
      disabled={disabled}
      error={dirty ? error : null}
      icon={icon}
      inline={inline}
      label={checkboxLabel as string}
      name={name}
      onChange={onChange}
      optionalLabel={<FormattedMessage id="optionalLabel" />}
      readOnly={readOnly}
      required={required}
      size={size}
      switch={Boolean(switchType)}
      switchOptions={switchType}
      tag={utils.remap(tag, value) as string}
      title={(utils.remap(labelText, value) as string) ?? (checkboxLabel as string) ?? null}
      value={Boolean(value)}
    />
  );
}