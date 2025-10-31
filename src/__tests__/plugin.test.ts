import { ContentStorageBackend } from '../plugin';
import type { Services, InitOptions } from 'i18next';

// Mock fetch
global.fetch = jest.fn();

describe('ContentStorageBackend', () => {
  let backend: ContentStorageBackend;
  let mockServices: Services;
  let mockOptions: InitOptions;

  beforeEach(() => {
    backend = new ContentStorageBackend();
    mockServices = {} as Services;
    mockOptions = {};

    // Delete memory map completely
    const win = window as any;
    delete win.memoryMap;

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      backend.init(mockServices, {}, mockOptions);

      expect(backend).toBeDefined();
      expect((backend as any).options.debug).toBe(false);
      expect((backend as any).options.maxMemoryMapSize).toBe(10000);
    });

    it('should merge custom options', () => {
      const customOptions = {
        debug: true,
        maxMemoryMapSize: 5000,
      };

      backend.init(mockServices, customOptions, mockOptions);

      expect((backend as any).options.debug).toBe(true);
      expect((backend as any).options.maxMemoryMapSize).toBe(5000);
    });

    it('should initialize memory map when in live mode', () => {
      backend.init(mockServices, { forceLiveMode: true }, mockOptions);

      expect((window as any).memoryMap).toBeInstanceOf(Map);
    });
  });

  describe('Loading Translations', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ welcome: 'Welcome', goodbye: 'Goodbye' }),
      });
    });

    it('should load translations from CDN', (done) => {
      backend.init(
        mockServices,
        { contentKey: 'test-key', forceLiveMode: false },
        mockOptions
      );

      backend.read('en', 'common', (err, data) => {
        expect(err).toBeNull();
        expect(data).toEqual({ welcome: 'Welcome', goodbye: 'Goodbye' });
        expect(global.fetch).toHaveBeenCalledWith(
          'https://cdn.contentstorage.app/test-key/content/EN.json',
          expect.any(Object)
        );
        done();
      });
    });

    it('should use uppercase language code by default', (done) => {
      backend.init(
        mockServices,
        {
          contentKey: 'test-key',
        },
        mockOptions
      );

      backend.read('fr', 'common', (err, data) => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://cdn.contentstorage.app/test-key/content/FR.json',
          expect.any(Object)
        );
        done();
      });
    });

    it('should use custom load path string', (done) => {
      backend.init(
        mockServices,
        {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        mockOptions
      );

      backend.read('en', 'common', (err, data) => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/locales/en/common.json',
          expect.any(Object)
        );
        done();
      });
    });

    it('should use custom load path function', (done) => {
      backend.init(
        mockServices,
        {
          loadPath: (lng, ns) => `https://api.example.com/${lng}/${ns}`,
        },
        mockOptions
      );

      backend.read('en', 'common', (err, data) => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/en/common',
          expect.any(Object)
        );
        done();
      });
    });

    it('should handle fetch errors', (done) => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      backend.init(mockServices, { contentKey: 'test-key' }, mockOptions);

      backend.read('en', 'common', (err, data) => {
        expect(err).toBeInstanceOf(Error);
        expect(data).toBe(false);
        done();
      });
    });
  });

  describe('Translation Tracking', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          welcome: 'Welcome',
          nested: {
            goodbye: 'Goodbye',
          },
        }),
      });
    });

    it('should track translations when in live mode', (done) => {
      backend.init(
        mockServices,
        { contentKey: 'test-key', forceLiveMode: true },
        mockOptions
      );

      backend.read('en', 'common', (err, data) => {
        const memoryMap = (window as any).memoryMap;

        expect(memoryMap.has('Welcome')).toBe(true);
        expect(memoryMap.has('Goodbye')).toBe(true);

        const welcomeEntry = memoryMap.get('Welcome');
        expect(welcomeEntry.ids.has('common.welcome')).toBe(true);

        const goodbyeEntry = memoryMap.get('Goodbye');
        expect(goodbyeEntry.ids.has('common.nested.goodbye')).toBe(true);

        done();
      });
    });

    it('should not track translations when not in live mode', (done) => {
      backend.init(
        mockServices,
        { contentKey: 'test-key', forceLiveMode: false },
        mockOptions
      );

      backend.read('en', 'common', (err, data) => {
        const memoryMap = (window as any).memoryMap;
        expect(memoryMap).toBeUndefined();
        done();
      });
    });

    it('should respect trackNamespaces filter', (done) => {
      backend.init(
        mockServices,
        {
          contentKey: 'test-key',
          forceLiveMode: true,
          trackNamespaces: ['homepage'],
        },
        mockOptions
      );

      backend.read('en', 'common', (err, data) => {
        const memoryMap = (window as any).memoryMap;
        expect(memoryMap.size).toBe(0); // Should not track 'common' namespace
        done();
      });
    });
  });

  describe('Custom Request', () => {
    it('should use custom request function', (done) => {
      const customRequest = jest.fn().mockResolvedValue({
        welcome: 'Custom Welcome',
      });

      backend.init(
        mockServices,
        {
          contentKey: 'test-key',
          request: customRequest,
        },
        mockOptions
      );

      backend.read('en', 'common', (err, data) => {
        expect(customRequest).toHaveBeenCalled();
        expect(data).toEqual({ welcome: 'Custom Welcome' });
        done();
      });
    });
  });
});
