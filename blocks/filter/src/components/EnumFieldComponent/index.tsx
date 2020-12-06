import { useBlock } from '@appsemble/preact';
import { Option, Select } from '@appsemble/preact-components';
import { VNode } from 'preact';

import { EnumField, FieldComponentProps } from '../../../block.js';

export function EnumFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<EnumField>): VNode {
  const { utils } = useBlock();

  return (
    <Select
      className={className}
      fullWidth
      loading={loading}
      name={field.name}
      onChange={onChange}
      value={value}
    >
      {field.enum.map(({ label, value: val }) => (
        <Option key={val} value={val}>
          {(utils.remap(label, {}) as string) || val}
        </Option>
      ))}
    </Select>
  );
}
