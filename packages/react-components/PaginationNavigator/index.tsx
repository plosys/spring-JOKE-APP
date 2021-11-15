
import { Button, SelectField } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { PaginationNumbers } from '../PaginationNumbers/index.js';
import { messages } from './messages.js';

export interface PaginationNavigatorProps {
  /**
   * An array of amounts of rows to display per page. Infinity represents all rows.
   */
  rowsPerPageOptions: number[];
  /**
   * The amount of rows to display per page.
   */
  rowsPerPage: number;
  /**
   * The maximum number of entries.
   */
  count: number;
  /**
   * The current page to display.
   */
  page: number;
  /**
   * The callback to invoke when the page changes.
   *
   * @param page
   */
  onPageChange: (page: number) => void;
  /**
   * The callback to invoke when the amount of rows per page changes.
   *
   * @param rowsPerPage
   */
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

/**
 * A component to render a pagination control. Contains a dropdown to select the amount of rows to