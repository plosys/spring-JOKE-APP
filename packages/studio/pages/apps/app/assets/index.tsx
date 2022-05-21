import {
  Button,
  Checkbox,
  Content,
  FileUpload,
  ModalCard,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { PaginationNavigator } from '@appsemble/react-components/PaginationNavigator';
import { Asset } from '@appsemble/types';
import { compareStrings, normalize } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';

import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { useApp } from '../index.js';
import { AssetRow } from './AssetRow/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface FormValues {
  file: File;
  name: string;
}

const defaultFormValues: FormValues = {
  file: undefined,
  name: '',
};

export function AssetsPage(): ReactElement {
  useMeta(messages.title);

  const { app } = useApp();
  const { formatMessage } = useIntl();
  const push = useMessages();
  const [searchParams, setSearchParams] = useSearchParams();

  const offset = Number(searchParams.get('offset'));
  const limit =
    searchParams.get('limit') === 'none'
      ? Number.POSITIVE_INFINITY
      : Number(searchParams.get('limit')) || 10;
  const rowsPerPage = limit;
  const page = limit === Number.POSITIVE_INFINITY ? 1 : Math.floor(offset / limit) + 1;

  const resultCount = useData<number>(`/api/apps/${app.id}/assets/$count`);
  const assetsResult = useData<Asset[]>(
    `/api/apps/${app.id}/assets?${new URLSearchParams({
      $skip: String(offset),
      ...(Number.isFinite(limit) && { $top: String(limit) }),
    })}`,
  );

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const dialog = useToggle();

  const { setData } = assetsResult;
  const count = resultCount.data;

  const updatePagination = useCallback(
    (newCount: number) => {
      const newPage =
        rowsPerPage === Number.POSITIVE_INFINITY
          ? 1
          : page >= Math.ceil(newCount / rowsPerPage)
          ? Math.ceil(newCount / rowsPerPage)
          : page;
      setSearchParams(
        Number.isFinite(rowsPerPage)
          ? { offset: String((newPage - 1) * rowsPerPage), limit: String(rowsPerPage) }
          : { offset: '0', limit: 'none' },
      );
      resultCount.setData(newCount);
    },
    [page, resultCount, rowsPerPage, setSearchParams],
  );

  const submitAsset = useCallback(
    async ({ file, name }: FormValues) => {
      const formData = new FormData();
      formData.append('file', file);
      if (name) {
        formData.append('name', normalize(name));
      }
      const { data } = await axios.post<Asset>(`/api/apps/${app.id}/assets`, formData);

      push({ color: 'success', body: formatMessage(messages.uploadSuccess, { id: data.id }) });

      setData((assets) => [...assets, data]);
      updatePagination(count + 1);
      dialog.disable();
    },
    [app.id, count, dialog, formatMessage, push, setData, updatePagination],
  );

  const onDelete = useConfirmation({
    title: (
      <FormattedMessage
        {...messages.deleteWarningTitle}
        values={{ amount: selectedAssets.length }}
      />
    ),
    body: (
      <FormattedMessage values={{ amount: selectedAssets.length }} {...messages.deleteWarning} />
    ),
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    color: 'danger',
    async action() {
      await axios.delete(`/api/apps/${app.id}/assets`, { data: selectedAssets });

      push({
        body: formatMessage(messages.deleteSuccess, {
          amount: select