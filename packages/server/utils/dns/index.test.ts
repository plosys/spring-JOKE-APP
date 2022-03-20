import { setArgv } from '../argv.js';
import { cleanupDNS, configureDNS, restoreDNS } from './index.js';
import * as kubernetes from './kubernetes.js';

// XXX These tests are skipped, because we currently can’t mock relative ESM imports in jest.

beforeEach(() => {
  import.meta.jest.spyOn(kubernetes, 'configureDNS').mockResolvedValue(null);
  import.meta.je