import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ResourceSubscriptionUnsubscribeActionDefinition = extendJSONSchema(
  BaseActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.subscription.unsubscribe'],
        descrip