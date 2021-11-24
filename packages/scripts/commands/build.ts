import { rm } from 'node:fs/promises';

import { logger, writeData } from '@appsemble/node-utils';
import { createAppConfig, createStudioConfig } from '@appsemble/webpack-core';
i