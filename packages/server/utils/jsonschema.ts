
import { badRequest } from '@hapi/boom';
import { ValidatorResult } from 'jsonschema';

export function handleValidatorResult(
  result: ValidatorResult,
  msg = 'JSON schema validation failed',
): void {
  if (!result.valid) {
    throw badRequest(msg, { errors: result.errors });
  }
}