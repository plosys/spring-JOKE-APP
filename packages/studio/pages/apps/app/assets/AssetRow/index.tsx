import { Button, Checkbox, ModalCard, useToggle } from '@appsemble/react-components';
import { Asset } from '@appsemble/types';
import { ChangeEvent, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { useApp } from '../../index.js';
import { AssetPreview } from '../AssetPreview/index.js';
import { messages } from './messages.js';

interface AssetRowProps {
  /**
   * The asset to render a row fow.
   */
  asset: Asset;

  onSelect: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;

  isSelected: boolean;
}

/**
 * Render a table row in the asset overview.
 */
export function AssetRow({ asset, isSelected, onSelect }: AssetRowProps): ReactElement {
  const { app } = useApp();
  const preview = useToggle();

  return (
    <tr key={asset.id}>
      <td>
        <Checkbox
          className="is-inline-block mt-2"
          name={`asset${asset.id}`}
          onChange={onSelect}
          value={isSelected}
        />
        <Button
          color="primary"
          component="a"
          download
          href={`/api/apps/${app.id}/assets/${asset.id}`}
          icon="download"
        />
      </td>
      <td>{asset.name || asset.id}</td>
      <td>
        {asset.resourceId == null ? null : (
          <Link to={`./resources/${asset.resourceType}/${asset.resourceId}`}>
            {asset.resourceId}
          </Link>
        )}
      </td>
      <td>{asset.mime}</td>
      <td>{asset.filename}</td>
      <td>
        <Button onCl