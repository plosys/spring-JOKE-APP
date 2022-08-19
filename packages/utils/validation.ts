import {
  AppDefinition,
  BlockManifest,
  ResourceGetActionDefinition,
  RoleDefinition,
} from '@appsemble/types';
import cronParser from 'cron-parser';
import { Schema, ValidationError, Validator, ValidatorResult } from 'jsonschema';
import languageTags from 'language-tags';
import { Promisable } from 'type-fest';

import { getAppBlocks, IdentifiableBlock, normalizeBlockName } from './blockUtils.js';
import { has } from './has.js';
import { partialNormalized } from './index.js';
import { iterApp, Prefix } from './iterApp.js';

type Report = (instance: unknown, message: string, path: (number | string)[]) => void;

/**
 * Check whether or not the given link represents a link related to the Appsemble core.
 *
 * @param link The link to check
 * @returns Whether or not the given link represents a link related to the Appsemble core.
 */
export function isAppLink(link: string[] | string): boolean {
  return link === '/Login' || link === '/Settings';
}

function validateJSONSchema(schema: Schema, prefix: Prefix, report: Report): void {
  if (schema.type === 'object') {
    if ('properties' in schema) {
      if (Array.isArray(schema.required)) {
        for (const [index, name] of schema.required.entries()) {
          if (!has(schema.properties, name)) {
            report(name, 'is not defined in properties', [...prefix, 'required', index]);
          }
        }
      }
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        validateJSONSchema(propertySchema, [...prefix, 'properties', key], report);
      }
    } else {
      report(schema, 'is missing properties', prefix);
    }
  }
}

function validateResourceSchemas(definition: AppDefinition, report: Report): void {
  if (!definition.resources) {
    return;
  }

  for (const [resourceName, resource] of Object.entries(definition.resources)) {
    // Handled by schema validation
    if (!resource?.schema) {
      continue;
    }

    const { schema } = resource;
    const prefix = ['resources', resourceName, 'schema'];

    validateJSONSchema(schema, prefix, report);
    if (!('type' in schema)) {
      report(schema, 'must define type object', prefix);
    } else if (schema.type !== 'object') {
      report(schema.type, 'must define type object', [...prefix, 'type']);
    }
    if ('properties' in schema) {
      for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
        if (propertyName === 'id') {
          for (const [validatorKey, value] of Object.entries(propertySchema)) {
            if (validatorKey === 'description' || validatorKey === 'title') {
              continue;
            }
            if (validatorKey === 'type') {
              if (value !== 'integer' && value !== 'number') {
                report(value, 'must be integer', [
                  ...prefix,
                  'properties',
                  propertyName,
                  validatorKey,
                ]);
              }
              continue;
            }
            report(value, 'does not support custom validators', [
              ...prefix,
              'properties',
              propertyName,
              validatorKey,
            ]);
          }
        } else if (propertyName === '$created' || propertyName === '$updated') {
          for (const [validatorKey, value] of Object.entries(propertySchema)) {
            if (validatorKey === 'description' || validatorKey === 'title') {
              continue;
            }
            if (validatorKey === 'type') {
              if (value !== 'string') {
                report(value, 'must be string', [
                  ...prefix,
                  'properties',
                  propertyName,
                  validatorKey,
                ]);
              }
              continue;
            }
            if (validatorKey === 'format') {
              if (value !== 'date-time') {
                report(value, 'must be date-time', [
                  ...prefix,
                  'properties',
                  propertyName,
                  validatorKey,
                ]);
              }
              continue;
            }
            report(value, 'does not support custom validators', [
              ...prefix,
              'properties',
              propertyName,
              validatorKey,
            ]);
          }
        } else if (propertyName.startsWith('$')) {
          report(propertySchema, 'may not start with $', [...prefix, 'properties', propertyName]);
        }
      }
    }
  }
}

function validateBlocks(
  definition: AppDefinition,
  blockVersions: Map<string, Map<string, BlockManifest>>,
  report: Report,
): void {
  iterApp(definition, {
    onBlock(block, path) {
      const type = normalizeBlockName(block.type);
      const versions = blockVersions.get(type);
      if (!versions) {
        report(block.type, 'is not a known block type', [...path, 'type']);
        return;
      }
      const actionParameters = new Set<string>();
      const version = versions.get(block.version);
      if (!version) {
        report(block.version, 'is not a known version for this block type', [...path, 'version']);
        return;
      }

      if (version.parameters) {
        const validator = new Validator();

        validator.customFormats.fontawesome = () => true;
        validator.customFormats.remapper = () => true;
        validator.customFormats.action = (property) => {
          actionParameters.add(property);
          return has(block.actions, property);
        };
        validator.customFormats['event-listener'] = (property) =>
          has(block.events?.listen, property);
        validator.customFormats['event-emitter'] = (property) => has(block.events?.emit, property);
        const result = validator.validate(block.parameters || {}, version.parameters, {
          nestedErrors: true,
        });
        if ('parameters' in block) {
          for (const error of result.errors) {
            report(error.instance, error.message, [...path, 'parameters', ...error.path]);
          }
        } else if (!result.valid) {
          report(block, 'requires property "parameters"', path);
        }
      } else if (block.parameters) {
        report(block.parameters, 'is not allowed on this block type', [...path, 'parameters']);
      }

      if (block.actions) {
        if (version.actions) {
          for (const [key, action] of Object.entries(block.actions)) {
            if (version.actions.$any) {
              if (actionParameters.has(key)) {
                continue;
              }

              if (!has(version.actions, key) && !version.wildcardActions) {
                report(action, 'is unused', [...path, 'actions', key]);
              }
            } else if (!has(version.actions, key)) {
              report(action, 'is an unknown action for this block', [...path, 'actions', key]);
            }
          }
        } else {
          report(block.actions, 'is not allowed on this block', [...path, 'actions']);
        }
      }

      if (!block.events) {
        return;
      }
      if (block.events.emit) {
        for (const [key, value] of Object.entries(block.events.emit)) {
          if (!version.events?.emit?.$any && !has(version.events?.emit, key)) {
            report(value, 'is an unknown event emitter', [...path, 'events', 'emit', key]);
          }
        }
      }
      if (block.events.listen) {
        for (const [key, value] of Object.entries(block.events.listen)) {
          if (!version.events?.listen?.$any && !has(version.events?.listen, key)) {
            report(value, 'is an unknown event listener', [...path, 'events', 'listen', key]);
          }
        }
      }
    },
  });
}

function checkCyclicRoleInheritance(
  roles: Record<string, RoleDefinition>,
  name: string,
  report: Report,
): void {
  let lastchecked: string;
  const stack: string[] = [];

  const checkRoleRecursively = (role: string): boolean => {
    lastchecked = role;
    if (stack.includes(role)) {
      return true;
    }
    stack.push(role);
    return roles[role]?.inherits?.some(checkRoleRecursively);
  };

  const duplicate = checkRoleRecursively(name);
  if (duplicate && lastchecked === name) {
    report(roles[name], 'cyclicly inherits itself', ['security', 'roles', name]);
  }
}

/**
 