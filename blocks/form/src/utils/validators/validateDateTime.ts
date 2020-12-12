
import { Remapper } from '@appsemble/sdk';

import { DateField, DateTimeField, DateTimeRequirement, Values } from '../../../block.js';
import { isValidDate } from '../requirements.js';

/**
 * Validates a date time based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @param remap The remap function to use within the validators.
 * @param values The form values used in the remap function.
 * @returns The first requirement that failed validation.
 */
export function validateDateTime(
  field: DateField | DateTimeField,
  value: string,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
  values?: Values,
): DateTimeRequirement {
  return field.requirements?.find((requirement) => {
    if ('required' in requirement && !value) {
      return true;
    }

    if ('from' in requirement && value) {
      const fromDate = new Date(remap(requirement.from, values));

      if (!isValidDate(fromDate)) {
        return false;
      }

      const isoDate =
        field.type === 'date-time' ? fromDate.toISOString() : fromDate.toISOString().split('T')[0];
      return isoDate > value;
    }

    if ('to' in requirement && value) {
      const toDate = new Date(remap(requirement.to, values));

      if (!isValidDate(toDate)) {
        return false;
      }

      const isoDate =
        field.type === 'date-time' ? toDate.toISOString() : toDate.toISOString().split('T')[0];
      return isoDate < value;
    }
  });
}