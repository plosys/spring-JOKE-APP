import { bootstrap } from '@appsemble/sdk';
import Vimeo, { TimeEvent } from '@vimeo/player';

import styles from './index.module.css';

// https://github.com/vimeo/player.js/blob/989954e5645999c7ef0e5fbccaea04dedf1bec17/src/lib/functions.js#L61
const vimeoRegex = /^(https?:)?\/\/((player|www)\.)?vimeo\.com(?=$|\/)/;

bootstrap(
  ({
    actions,
    data,
    events,
    parameters: {
      autoplay = false,
      height,
      maxHeight,
      maxWidth,
      muted = false,
      subtitles,
      url,
      volume,
      width,
    },
    shadowRoot,
    theme,
    utils,
  }) => {
    const errorNode = document.createElement('article');
    errorNode.className = `my-4 message is-danger ${styles.error}`;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'message-body';
    errorMessage.textContent = utils.formatMessage('loadErrorMessage');
    errorNode.append(errorMessage);
    let player: Vimeo;
    let playerDiv: HTMLDivElement;
    let currentUrl: string;
    let finished = false;
    const onFinish = (): void => {
      if (finished) {
        return;
      }

      finished = true;
      actions.onFinish(data, { videoId: currentUrl.match(/\d+/)?.[0], videoUrl: currentUrl });
    };
    const onTimeUpdate = ({ duration, seconds }: TimeEvent): void => {
      if (seconds > duration - 0.5) {
        onFinish();
      }
    };
    utils.addCleanup(() => player?.destroy());

    const setupError = (): void => {
      player?.destroy();
      playerDiv?.rem