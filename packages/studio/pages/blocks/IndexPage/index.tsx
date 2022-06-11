import { Loader, Message, useData } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { BlockCard } from '../../../components/BlockCard/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * Display a list of cards representing the available blocks.
 */
export function IndexPage(): ReactElement {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

  const appsembleBlocks 