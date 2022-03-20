import { setArgv } from '../argv.js';
import { cleanupDNS, configureDNS, restoreDNS } from './index.js';
import * as kubernetes from './kubernetes.js';

// XXX These tests are skipped, because we currently can’t mock relative ESM imports in jest.

beforeEach(() => {
  import.meta.jest.spyOn(kubernetes, 'configureDNS').mockResolvedValue(null);
  import.meta.jest.spyOn(kubernetes, 'cleanupDNS').mockResolvedValue(null);
  import.meta.jest.spyOn(kubernetes, 'restoreDNS').mockResolvedValue(null);
});

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('configureDNS', () => {
  it('should delegate configureDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
    setArgv({ appDomainStrategy: 'kubernetes-ingress' });
    await configureDNS();
    expect(kubernetes.configureDNS).toHaveBeenCalledWith();
  });

  it('should not delegate configureDNS to kubernetes if the app domain strategy is undefined', async () => {
    setArgv({});
    await configureDNS();
    expect(kubernetes.configureDNS).not.toHaveBeenCalled();
  });

  it('should throw if the app domain strategy is unknown', async () => {
    setArgv({ appDomainStrategy: 'unknown' });
    await expect(configureDNS()).rejects.toThrow("Unknown app domain strategy: 'unknown'");
  });
});

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('cleanupDNS', () => {
  it('should delegate cleanupDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
    setArgv({ appDomainStrategy: 'kubernetes-ingress' });
    await cleanupDNS();
    expect(kubernetes.cleanupDNS).toHaveBeenCalledWith();
  });

  it('should not delegate cleanupDNS to kubernetes if the app domain strategy is undefined', async () => {
    setArgv({});
    await cleanupDNS();
    expect(kubernetes.cleanupDNS).not.toHaveBeenCalled();
  });

  it('should throw if the app domain strategy is unknown', async () => {
    setArgv({ appDomainStrategy: 'unknown' });
    await expect(cleanupDNS()).rejects.toThrow("Unknown app domain strategy: 'unknown'");
  });
});

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('restoreDNS', () => {
  it('should delegate restoreDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
    setArgv({ appDomainStrategy: 'kubernetes-ingress' });
    await restoreDNS();
    expect(kubernetes.restoreDNS).toHaveBeenCalledWith();
  });

  it('should not delegate restoreDNS to kubernetes if the app domain strategy is undefined', async () => {
    setArgv({});
    await restoreDNS();
    expect(kubernetes.restoreDNS).not.toHaveBeenCalled();
  });

  it('should throw if the app domain strategy is unknown', async () => {
    setArgv({ appDomainStrategy: 'unknown' });
    await expect(restoreDNS()).rejects.toThrow("Unknown app domain strategy: 'unknown'");
  });
});
