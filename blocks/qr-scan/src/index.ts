import { bootstrap } from '@appsemble/sdk';
import jsQR from 'jsqr';

bootstrap(({ events, parameters: { drawQr = false, height = 0, width = 0 }, theme, utils }) => {
  const div = document.createElement('div');

  // Create elements
  const video = document.createElement('video');
  const canvasElement = document.createElement('canvas');
  const canvas = canvasElement.getContext('2d');

  let stopped = false;
  utils.addCleanup(() => {
    stopped = true;
  });

  /**
   * Find and open qr code
   */
  function tick(): void {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.hidden = false;

      // Set height and width of canvas element
      canvasElement.height = height === 0 