import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const DialogActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'blocks'],
  properties: {
    type: {
      enum: ['dialog'],
      description: `This action opens a pop-up dialog that can be used to seamlessly transition to a new set of blocks temporarily.

Dialogs can be closed by calling the [\`dialog.ok\`](#DialogOkAc