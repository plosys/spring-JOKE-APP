import { EnumField, RadioField, RequiredRequirement } from '../../../block.js';

/**
 * Validates an enum picker based on a set of requirements.
 *
 * @param field The field to validate.
 * @param value The value of the field.
 * @returns The first requirement that failed validation.
 */
export function