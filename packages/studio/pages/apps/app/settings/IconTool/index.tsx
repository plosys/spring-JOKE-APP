import {
  Button,
  Icon,
  Input,
  RadioButton,
  RadioGroup,
  useConfirmation,
  useMessages,
  useSimpleForm,
} from '@appsemble/react-components';
import axios from 'axios';
import { ChangeEvent, ReactElement, SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';
import { IconPicker } from '../IconPicker/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

const shapes = {
  minimal: 'inset(10% round 40%)',
  circle: 'inset(0 round 50%)',
  rounded: 'inset(0 round 20%)',
  square: 'inset(0)',
};

interface IconToolProps {
  disabled?: boolean;
}

export function IconTool({ disabled }: IconToolProps): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const { app, setApp } = useApp();
  const { organizations } = useUser();
  const { setValue, values } = useSimpleForm();
  const { lang } = useParams<{ lang: string }>();

  const organization = organizations.find((org) => org.id === app.OrganizationId)!;

  const [shape, setShape] = useState<keyof typeof shapes>('minimal');

  let { icon, maskableIcon } = values;
  let scaleMaskableIcon = false;
  if (!icon) {
    if (app.iconUrl) {
      icon = `/api/apps/${app.id}/icon`;
    } else {
      if (organization.iconUrl) {
        icon = `/api/organizations/${organization.id}/icon`;
      }
    }
  }
  if (maskableIcon) {
    maskableIcon = URL.createObjectURL(maskableIcon);
  } else {
    if (app.hasMaskableIcon) {
      maskableIcon = `/api/apps/${app.id}/icon?maskable=true`;
    } else {
      scaleMaskableIcon = true;
      if (typeof icon === 'string') {
        maskableIcon = `/api/apps/${app.id}/icon?raw=true`;
      } else if (icon instanceof Blob) {
        maskableIcon = URL.createObjectURL(icon);
      }
    }
  }
  if (icon instanceof Blob) {
    icon = URL.createObjectURL(icon);
  }

  useEffect(() => () => URL.revokeObjectURL(icon), [icon]);
  useEffect(() => () => URL.revokeObjectURL(maskableIcon), [maskableIcon]);

  const shapeShift = useCallback((event: ChangeEvent, value: typeof shape) => setShape(value), []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: unknown) => {
      setValue(event.currentTarget.name, value);
      setApp({ ...app, [event.currentTarget.name]: Boolean(value) });
    },
    [setValue, setApp, app],
  );

  const handleMaskableIconLoad = useCallback(
    ({
      currentTarget: { classList, naturalHeight, naturalWidth, style },
    }: SyntheticEvent<HTMLImageElement>) => {
      if (classList.contains(styles.fill)) {
        // eslint-disable-next-line no-param-reassign
        style.width = '';
      } else {
        const safeAreaDiameter = 80;
        const angle = Math.atan(naturalHeight / naturalWidth);
        // eslint-disable-next-line no-param-reassign
        style.width = `${Math.cos(angle) * safeAreaDiameter}%`;
      }
    },
    [],
  );

  const onDeleteIcon = useConfirmation({
    title: <FormattedMessage {...messages.deleteIconWarningTitle} />,
    body: <FormattedMessage {...messages.deleteIconWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      const { id } = app;

      try {
        await axios.delete(`/api/apps/${id}/icon`);
        push({
          body: formatMessage(messages.deleteIconSuccess),
          color: 'info',
        });
        setApp({
          ...app,
          hasIcon: false,
          iconUrl: null,
        });
        setValue('icon', null);
      } catch {
        push(formatMessage(messages.errorIconDelete));
      }
    },
  });

  const onDeleteMaskableIcon = useConfirmation({
    title: <FormattedMessage {...messages.deleteIconWarningTitle} />,
    body: <FormattedMessage {...messages.deleteIconWarning} />,
    cancelLabel: <FormattedMessage {...mes