import { useBlock } from '@appsemble/preact';
import { DateTimeField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { JSX, VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { DateField, InputProps } from '../../../block.js';
import { useLocale } from '../../hooks/useLocale.js';
import { extractDate } from '../../utils/extractDate.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getDisabledDays, getMaxDate, getMinDate, isRequired } from '../../utils/requirements.js';

type DateTimeInputProps = InputProps<string, DateField>;

/**
 * An input element for a date value.
 */
export function DateInput({
  className,
  dirty,
  disabled,
  error,
  field,
  formValues = null,
  onChange,
  readOnly,
}: DateTimeInputProps): VNode {
  const { utils } = useBlock();
  const { inline, label, name, placeholder, tag } = field;

  const value = getValueByNameSequence(name, formValues);
  const dateLabel = utils.remap(label, value) as string;
  const confirmLabel = utils.formatMessage('confirmLabel');

  const required = isRequired(field)