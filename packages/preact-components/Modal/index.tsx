
import classNames from 'classnames';
import { ComponentChildren, ComponentProps, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { ElementType, useAnimation } from '../index.js';
import styles from './index.module.css';

interface ModalProps<T extends ElementType> {
  /**
   * The child elements to render on the modal.
   */
  children?: ComponentChildren;

  /**
   * Whether the user is allowed to click on the close button or outside of the modal to close it.
   */
  closable?: boolean;

  /**
   * The aria label to apply on the close button.
   */
  closeButtonLabel?: string;

  /**
   * The Preact component to render as the root for the modal.
   */
  component?: T;

  /**
   * Wether or not the modal is currently active.
   */
  isActive: boolean;

  /**
   * A function that will be called when the user closes the modal.
   */
  onClose?: (event: Event) => void;

  /**
   * The CSS class applied to the body.
   */
  className?: string;
}

/**
 * Render an aria compliant modal overlay.
 */
export function Modal<T extends ElementType = 'div'>({
  children = null,
  className,
  closable = true,
  closeButtonLabel,
  component: Component = 'div' as T,
  isActive,
  onClose,
  ...props
}: ModalProps<T> & Omit<ComponentProps<T>, keyof ModalProps<T>>): VNode {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.(event);
      }
    },
    [onClose],
  );

  if (!openClass) {
    return null;
  }

  return (
    <div className={`is-active modal ${styles.root} ${openClass}`}>
      <div
        className="modal-background"
        onClick={closable ? onClose : null}
        onKeyDown={closable ? onKeyDown : null}
        role="presentation"
      />
      {/* @ts-expect-error This construct should work */}
      <Component className={classNames('modal-content', className)} {...props}>
        {children}
      </Component>
      {closable ? (
        <button
          aria-label={closeButtonLabel}
          className="modal-close is-large"
          onClick={onClose}
          type="button"
        />
      ) : null}
    </div>
  );
}