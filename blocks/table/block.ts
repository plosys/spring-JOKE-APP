import { BulmaColor, BulmaSize, IconName, Remapper } from '@appsemble/sdk';

interface BaseField {
  /**
   * An optional label used in the header of the table.
   *
   * If this isn’t specified, no label will be shown. If no fields have a label, the table header
   * row won’t be shown.
   */
  label?: Remapper;

  /**
   * Whether the content of the cell should be aligned left, right, or centered
   */
  alignment?: 'center' | 'left' | 'right';
}

/**
 * Represents a column that should be displayed in the table.
 */
export interface Field extends BaseField {
  /**
   * The value of the field.
   */
  value: Remapper;

  /**
   * The name of the action to trigger when clicking on this field.
   *
   * @format action
   */
  onClick?: string;
}

export interface Button extends BaseField {
  /**
   * The name of the action to trigger when clicking on this field.
  