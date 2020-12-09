import { VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { Field, InputProps } from '../../../block.js';
import { BooleanInput } from '../BooleanInput/index.js';
import { DateInput } from '../DateInput/index.js';
import { DateTimeInput } from '../DateTimeInput/index.js';
import { EnumInput } from '../EnumInput/index.js';
import { Fieldset } from '../Fieldset/index.js';
import { FileInput } from '../FileInput/index.js';
import { GeoCoordinatesInput } from '../GeoCoordinatesInput/index.js';
import { NumberInput } from '../NumberInput/index.js';
import { RadioInput } from '../RadioInput/index.js';
import { StaticField } from '../StaticField/index.js';
import { StringInput } from '../StringInput/index.js';

type FormInputProps = Omit<InputProps<any, Field>, 'dirty'>;

/**
 * Render any type of form input.
 */
export function FormInput({ field, onChange, ...props }: FormInputProps): VNode {
  const [dirty, setDirty] = useState(fal