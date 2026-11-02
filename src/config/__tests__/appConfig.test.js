import { resolveApiUrl } from '../appConfig';

const LOCAL = 'http://localhost:3001/api';

describe('API base resolution across platforms', () => {
  it('leaves an explicitly configured remote API untouched', () => {
    const remote = 'https://api.qitabe-noor.app/api';
    expect(resolveApiUrl(remote, {
      platform: 'android',
      hostUri: '192.168.1.20:8081',
    })).toBe(remote);
    expect(resolveApiUrl(remote, {
      platform: 'web',
      webHostname: '192.168.1.20',
    })).toBe(remote);
  });

  it('keeps loopback on the desktop web preview', () => {
    expect(resolveApiUrl(LOCAL, {
      platform: 'web',
      webHostname: 'localhost',
    })).toBe(LOCAL);
    expect(resolveApiUrl(LOCAL, {
      platform: 'web',
      webHostname: '127.0.0.1',
    })).toBe(LOCAL);
  });

  it('uses the page host when the web preview is opened over the LAN', () => {
    expect(resolveApiUrl(LOCAL, {
      platform: 'web',
      webHostname: '192.168.1.20',
    })).toBe('http://192.168.1.20:3001/api');
  });

  it('uses the Expo dev host on a physical phone', () => {
    expect(resolveApiUrl(LOCAL, {
      platform: 'android',
      hostUri: '192.168.1.20:8081',
    })).toBe('http://192.168.1.20:3001/api');

    // Expo Go occasionally reports a scheme with the host.
    expect(resolveApiUrl(LOCAL, {
      platform: 'ios',
      hostUri: 'exp://192.168.1.20:8081',
    })).toBe('http://192.168.1.20:3001/api');
  });

  it('keeps the configured port and path', () => {
    expect(resolveApiUrl('http://localhost:4000/custom/api/', {
      platform: 'ios',
      hostUri: '10.0.0.7:8081',
    })).toBe('http://10.0.0.7:4000/custom/api/');
  });

  it('falls back to loopback when no better host is known', () => {
    expect(resolveApiUrl(LOCAL, { platform: 'android', hostUri: '' })).toBe(LOCAL);
    expect(resolveApiUrl(LOCAL, { platform: 'ios', hostUri: 'localhost:8081' })).toBe(LOCAL);
    expect(resolveApiUrl(LOCAL, { platform: 'web', webHostname: '' })).toBe(LOCAL);
  });

  it('ignores missing configuration', () => {
    expect(resolveApiUrl('', { platform: 'android' })).toBe('');
    expect(resolveApiUrl(undefined, { platform: 'android' })).toBeUndefined();
    expect(resolveApiUrl(null, { platform: 'web' })).toBeNull();
  });
});
