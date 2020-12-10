import { useBlock } from '@appsemble/preact';
import { InputField, TextAreaField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';

import { InputProps, StringField } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getMaxLength, getMinLength, isRequired } from '../../utils/requirements.js';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export function StringInput({
  className,
  dirty,
  disabled,
  error,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: StringInputProps): VNode {
  const { utils } = useBlock();
  const { format, icon, inline, label, multiline, placeholder, tag } = field;

  const value = getValueByNameSequence(name, formValues) as string;
  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: classNames('appsemble-string', className),
    disabled,
    error: dirty && error,
    icon,
    label: remappedLabel as string,
    maxLength: getMaxLength(field),
    minLength: getMinLength(field),
    name,
    onChange,
    optionalLabel: utils.formatMessage('optionalLabel'),
    placeholder: (utils.remap(placeholder, value) ?? remappedLabel) as string,
    readOnly,
    required: isRequired(field, utils, formValues),
    tag: utils.remap(tag, value) as string,
    value,
    inline,
  };

  return multiline ? (
    <TextAreaField {...commonProps} />
  ) : (
    <InputField {...commonProps} type={format} />
  );
}
