
import { useBlock } from '@appsemble/preact';
import { isPreactChild } from '@appsemble/preact-components';
import { VNode } from 'preact';

import { RendererProps, StringField } from '../../../block.js';

/**
 * An element for a text type schema.
 */
export function StringRenderer({ data, field }: RendererProps<StringField>): VNode {
  const { utils } = useBlock();

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.value, data);

  return (
    <div className="appsemble-string mb-5">
      {isPreactChild(label) ? <h6 className="title is-6 mb-0">{label}</h6> : null}
      {value ? (
        <div className="content">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
      ) : null}
    </div>
  );
}