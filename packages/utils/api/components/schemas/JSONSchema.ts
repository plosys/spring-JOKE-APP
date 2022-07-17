import { OpenAPIV3 } from 'openapi-types';

export const JSONSchema: OpenAPIV3.NonArraySchemaObject = {
  anyOf: [
    { $ref: '#/components/schemas/JSONPointer' },
    { $ref: '#/components/schemas/JSONSchemaAnyOf' },
    { $ref: '#/components/schemas/JSONSchemaArray' },
    { $ref: '#/components/schemas/JSONSchemaBoolean' },
    { $ref: '#/components/schemas/JSONSchemaConst' },
    { $ref: '#/components/schemas/JSONSchemaEnum' },
    { $ref: '#/compon