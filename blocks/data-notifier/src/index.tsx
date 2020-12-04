import { bootstrap, Messages } from '@appsemble/sdk';
import equal from 'fast-deep-equal';

import styles from './index.module.css';

type Item = Record<string, unknown>;

type Data = Item | Item[];

bootstrap(({ events, parameters: { color = 'dark', id = 'id' }, utils }) => {
  let oldData: Data;
  let pendingData: Data;
  let message: HTMLElement;
  let messageText: HTMLElement;
  let messageBody: HTMLElement;

  const setPending = (newData: Data, msg: keyof Messages, count: number): void => {
    pendingData = newData;
    messageText.textContent = utils.formatMessage(msg, { count });
    messageBody.classList.remove(styles.hidden, 'py-0');
    message.classList.add('my-3');
  };

  const onClick = (): void => {
    messageBody.classList.add(styles.hidden, 'py-0');
    message.classList.remove('my-3');
    oldData = pendingData;
    events.emit.data(pendingData);
  };

  events.on.seed((newData: Data) => {
    pendingData = newData;
    onClick();
  });

  events.on.data((newData: Data) => {
    // Just emit the data if there is nothing to compare against.
    if (oldData 