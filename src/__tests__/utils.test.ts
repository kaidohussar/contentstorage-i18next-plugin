import {
  detectLiveEditorMode,
  normalizeKey,
  extractBaseKey,
  removeInterpolation,
  flattenTranslations,
  trackTranslation,
  initializeMemoryMap,
  getMemoryMap,
} from '../utils';

describe('Utils', () => {
  describe('detectLiveEditorMode', () => {
    beforeEach(() => {
      // Reset window location
      delete (window as any).location;
      (window as any).location = { search: '' };
    });

    it('should return true when forceLiveMode is true', () => {
      expect(detectLiveEditorMode('param', true)).toBe(true);
    });

    it('should return false when not in iframe', () => {
      Object.defineProperty(window, 'top', {
        configurable: true,
        value: window.self,
      });

      (window as any).location.search = '?contentstorage_live_editor=true';
      expect(detectLiveEditorMode()).toBe(false);
    });

    it('should return false when param is missing', () => {
      Object.defineProperty(window, 'top', {
        configurable: true,
        value: {},
      });

      (window as any).location.search = '';
      expect(detectLiveEditorMode()).toBe(false);
    });
  });

  describe('normalizeKey', () => {
    it('should convert colon notation to dot notation', () => {
      expect(normalizeKey('common:welcome')).toBe('common.welcome');
    });

    it('should prepend namespace if provided', () => {
      expect(normalizeKey('welcome', 'common')).toBe('common.welcome');
    });

    it('should not duplicate namespace', () => {
      expect(normalizeKey('common.welcome', 'common')).toBe('common.welcome');
    });

    it('should handle nested keys', () => {
      expect(normalizeKey('pages.home.title', 'app')).toBe('app.pages.home.title');
    });
  });

  describe('extractBaseKey', () => {
    it('should remove plural suffixes', () => {
      expect(extractBaseKey('items_plural')).toBe('items');
      expect(extractBaseKey('items_one')).toBe('items');
      expect(extractBaseKey('items_other')).toBe('items');
    });

    it('should keep non-plural keys unchanged', () => {
      expect(extractBaseKey('welcome')).toBe('welcome');
      expect(extractBaseKey('hello_world')).toBe('hello_world');
    });
  });

  describe('removeInterpolation', () => {
    it('should remove interpolation variables', () => {
      expect(removeInterpolation('Hello {{name}}!')).toBe('Hello !');
      expect(removeInterpolation('You have {{count}} items')).toBe('You have  items');
    });

    it('should handle multiple interpolations', () => {
      expect(removeInterpolation('{{greeting}} {{name}}, welcome!')).toBe(', welcome!');
    });

    it('should return unchanged if no interpolations', () => {
      expect(removeInterpolation('Hello world')).toBe('Hello world');
    });
  });

  describe('flattenTranslations', () => {
    it('should flatten nested objects', () => {
      const translations = {
        common: {
          welcome: 'Welcome',
          goodbye: 'Goodbye',
        },
        pages: {
          home: {
            title: 'Home',
          },
        },
      };

      const flattened = flattenTranslations(translations);
      expect(flattened).toEqual([
        ['common.welcome', 'Welcome'],
        ['common.goodbye', 'Goodbye'],
        ['pages.home.title', 'Home'],
      ]);
    });

    it('should handle flat objects', () => {
      const translations = {
        welcome: 'Welcome',
        goodbye: 'Goodbye',
      };

      const flattened = flattenTranslations(translations);
      expect(flattened).toEqual([
        ['welcome', 'Welcome'],
        ['goodbye', 'Goodbye'],
      ]);
    });

    it('should skip non-string values', () => {
      const translations = {
        welcome: 'Welcome',
        count: 42,
        items: ['a', 'b'],
      };

      const flattened = flattenTranslations(translations);
      expect(flattened).toEqual([['welcome', 'Welcome']]);
    });
  });

  describe('Memory Map', () => {
    beforeEach(() => {
      // Clean up memory map
      const win = window as any;
      if (win.memoryMap) {
        win.memoryMap.clear();
      }
    });

    it('should initialize memory map', () => {
      initializeMemoryMap();
      expect((window as any).memoryMap).toBeInstanceOf(Map);
    });

    it('should get existing memory map', () => {
      initializeMemoryMap();
      const map = getMemoryMap();
      expect(map).toBe((window as any).memoryMap);
    });

    it('should track translation', () => {
      initializeMemoryMap();
      trackTranslation('Welcome', 'common.welcome', 'common', 'en', false);

      const map = getMemoryMap();
      expect(map?.has('Welcome')).toBe(true);

      const entry = map?.get('Welcome');
      expect(entry?.ids.has('common.welcome')).toBe(true);
      expect(entry?.type).toBe('text');
      expect(entry?.metadata?.namespace).toBe('common');
      expect(entry?.metadata?.language).toBe('en');
    });

    it('should track multiple keys for same value', () => {
      initializeMemoryMap();
      trackTranslation('Welcome', 'common.welcome', 'common', 'en', false);
      trackTranslation('Welcome', 'homepage.title', 'homepage', 'en', false);

      const map = getMemoryMap();
      const entry = map?.get('Welcome');

      expect(entry?.ids.size).toBe(2);
      expect(entry?.ids.has('common.welcome')).toBe(true);
      expect(entry?.ids.has('homepage.title')).toBe(true);
    });
  });
});
