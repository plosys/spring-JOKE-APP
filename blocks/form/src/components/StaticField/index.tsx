import { useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';

import { InputProps, StaticField as StaticFieldType } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';

type StaticFieldProps = Omit<InputProps<string, StaticFieldType>, 'onChang