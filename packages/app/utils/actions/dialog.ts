import { ActionCreator } from './index.js';

export const dialog: ActionCreator<'dialog'> = ({
  definition: { blocks, closable = true, fullscreen = false, title },
  prefix,
  prefixIndex,
  showDialog,
}) => [
  (data) =>
    new Promise((resolve, reject) => {
      const close = showDialog({
        actionCreators: {
          'dialog.error': () => [
            (error) => {
              reject(error);
              close();
   