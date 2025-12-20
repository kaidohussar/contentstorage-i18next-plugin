import {
  decodeContentstorageKey,
  detectScreenshotMode,
  cleanScreenshotUrlParams,
  exposeApiKey,
  getApiKey,
} from '../screenshot';

describe('Screenshot Utils', () => {
  describe('decodeContentstorageKey', () => {
    it('should decode URL-encoded key', () => {
      const encodedKey = '108541025900791613826%2Ffebe906c-7a8b-4b58-b792-77556c093dba';
      const decodedKey = '108541025900791613826/febe906c-7a8b-4b58-b792-77556c093dba';
      expect(decodeContentstorageKey(encodedKey)).toBe(decodedKey);
    });

    it('should return key as-is if not encoded', () => {
      const key = 'simple-key-value';
      expect(decodeContentstorageKey(key)).toBe(key);
    });

    it('should reject null or empty key', () => {
      expect(decodeContentstorageKey(null)).toBeNull();
      expect(decodeContentstorageKey('')).toBeNull();
    });

    it('should reject whitespace-only key', () => {
      expect(decodeContentstorageKey('   ')).toBeNull();
    });
  });

  describe('detectScreenshotMode', () => {
    beforeEach(() => {
      // Reset window location
      delete (window as any).location;
      (window as any).location = {
        search: '',
        href: 'http://localhost:3000',
      };
    });

    it('should detect valid screenshot mode params', () => {
      (window as any).location.search =
        '?contentstorage_live_editor=true&screenshot_mode=true&contentstorage_key=108541025900791613826%2Ffebe906c-7a8b-4b58-b792-77556c093dba';

      const config = detectScreenshotMode();

      expect(config).not.toBeNull();
      expect(config?.contentstorageKey).toBe('108541025900791613826/febe906c-7a8b-4b58-b792-77556c093dba');
    });

    it('should return null when contentstorage_live_editor is missing', () => {
      (window as any).location.search =
        '?screenshot_mode=true&contentstorage_key=108541025900791613826%2Ffebe906c-7a8b-4b58-b792-77556c093dba';

      expect(detectScreenshotMode()).toBeNull();
    });

    it('should return null when screenshot_mode is missing', () => {
      (window as any).location.search =
        '?contentstorage_live_editor=true&contentstorage_key=108541025900791613826%2Ffebe906c-7a8b-4b58-b792-77556c093dba';

      expect(detectScreenshotMode()).toBeNull();
    });

    it('should return null when contentstorage_key is missing', () => {
      (window as any).location.search = '?contentstorage_live_editor=true&screenshot_mode=true';

      expect(detectScreenshotMode()).toBeNull();
    });

    it('should accept any non-empty key (backend validates format)', () => {
      (window as any).location.search =
        '?contentstorage_live_editor=true&screenshot_mode=true&contentstorage_key=any-key-value';

      const config = detectScreenshotMode();
      expect(config).not.toBeNull();
      expect(config?.contentstorageKey).toBe('any-key-value');
    });

    it('should return null when live_editor param is not "true"', () => {
      (window as any).location.search =
        '?contentstorage_live_editor=false&screenshot_mode=true&contentstorage_key=108541025900791613826%2Ffebe906c-7a8b-4b58-b792-77556c093dba';

      expect(detectScreenshotMode()).toBeNull();
    });

    it('should return null when screenshot_mode is not "true"', () => {
      (window as any).location.search =
        '?contentstorage_live_editor=true&screenshot_mode=false&contentstorage_key=108541025900791613826%2Ffebe906c-7a8b-4b58-b792-77556c093dba';

      expect(detectScreenshotMode()).toBeNull();
    });
  });

  describe('cleanScreenshotUrlParams', () => {
    let replaceStateMock: jest.Mock;

    beforeEach(() => {
      replaceStateMock = jest.fn();

      delete (window as any).location;
      (window as any).location = {
        search: '?contentstorage_live_editor=true&screenshot_mode=true&contentstorage_key=123%2Fabc&other=param',
        href: 'http://localhost:3000?contentstorage_live_editor=true&screenshot_mode=true&contentstorage_key=123%2Fabc&other=param',
      };

      // Mock history.replaceState
      Object.defineProperty(window, 'history', {
        value: {
          replaceState: replaceStateMock,
        },
        writable: true,
        configurable: true,
      });
    });

    it('should remove screenshot params from URL', () => {
      cleanScreenshotUrlParams();

      expect(replaceStateMock).toHaveBeenCalled();

      // Check the URL passed to replaceState
      const calledWith = replaceStateMock.mock.calls[0][2];
      expect(calledWith).not.toContain('contentstorage_live_editor');
      expect(calledWith).not.toContain('screenshot_mode');
      expect(calledWith).not.toContain('contentstorage_key');
    });

    it('should preserve other params', () => {
      cleanScreenshotUrlParams();

      const calledWith = replaceStateMock.mock.calls[0][2];
      expect(calledWith).toContain('other=param');
    });
  });

  describe('exposeApiKey and getApiKey', () => {
    beforeEach(() => {
      // Clean up any existing key
      delete (window as any).__contentstorageApiKey;
    });

    it('should expose key as non-enumerable property', () => {
      const testKey = '123/test-uuid-here';

      exposeApiKey(testKey);

      // Check that property exists but is not enumerable
      expect((window as any).__contentstorageApiKey).toBe(testKey);
      expect(Object.keys(window)).not.toContain('__contentstorageApiKey');
    });

    it('should retrieve exposed key', () => {
      const testKey = '456/another-uuid';

      exposeApiKey(testKey);
      const retrieved = getApiKey();

      expect(retrieved).toBe(testKey);
    });

    it('should return null when no key exposed', () => {
      expect(getApiKey()).toBeNull();
    });
  });
});
