import {
  detectLiveEditorMode,
  normalizeKey,
  extractBaseKey,
  removeInterpolation,
  flattenTranslations,
  trackTranslation,
  initializeMemoryMap,
  getMemoryMap,
  extractUserVariables,
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

    it('should NOT prepend namespace by default', () => {
      expect(normalizeKey('welcome', 'common')).toBe('welcome');
    });

    it('should keep keys as-is when no colon notation', () => {
      expect(normalizeKey('common.welcome', 'common')).toBe('common.welcome');
    });

    it('should handle nested keys without namespace prefix', () => {
      expect(normalizeKey('pages.home.title', 'app')).toBe('pages.home.title');
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

    it('should track translation with variables', () => {
      initializeMemoryMap();
      const variables = { userName: 'John Doe' };
      trackTranslation('John Doe registered', 'user.registered', 'users', 'en', false, variables);

      const map = getMemoryMap();
      const entry = map?.get('John Doe registered');

      expect(entry?.ids.has('user.registered')).toBe(true);
      expect(entry?.variables).toEqual({ userName: 'John Doe' });
      expect(entry?.type).toBe('text');
    });

    it('should not include variables field when no variables provided', () => {
      initializeMemoryMap();
      trackTranslation('Welcome', 'common.welcome', 'common', 'en', false);

      const map = getMemoryMap();
      const entry = map?.get('Welcome');

      expect(entry?.variables).toBeUndefined();
    });

    it('should not include variables field when empty object provided', () => {
      initializeMemoryMap();
      trackTranslation('Welcome', 'common.welcome', 'common', 'en', false, {});

      const map = getMemoryMap();
      const entry = map?.get('Welcome');

      expect(entry?.variables).toBeUndefined();
    });

    it('should preserve variables when tracking same value again without variables', () => {
      initializeMemoryMap();

      // First track with variables (e.g., from post-processor)
      const variables = { userName: 'John Doe', count: 3 };
      trackTranslation('User activity', 'user.activity', undefined, 'en', false, variables);

      // Then track same value without variables (e.g., from backend)
      trackTranslation('User activity', 'user.activity', undefined, 'en', false);

      const map = getMemoryMap();
      const entry = map?.get('User activity');

      // Variables should still be present
      expect(entry?.variables).toEqual({ userName: 'John Doe', count: 3 });
    });

    it('should update variables when tracking same value with new variables', () => {
      initializeMemoryMap();

      // First track with initial variables
      trackTranslation('User activity', 'user.activity', undefined, 'en', false, { userName: 'Alice' });

      // Then track with updated variables
      trackTranslation('User activity', 'user.activity', undefined, 'en', false, { userName: 'Bob', action: 'login' });

      const map = getMemoryMap();
      const entry = map?.get('User activity');

      // Variables should be updated to the new ones
      expect(entry?.variables).toEqual({ userName: 'Bob', action: 'login' });
    });

    it('should add variables to entry that initially had none', () => {
      initializeMemoryMap();

      // First track without variables (e.g., from backend during initial load)
      trackTranslation('User registered', 'user.registered', undefined, 'en', false);

      const map1 = getMemoryMap();
      const entry1 = map1?.get('User registered');
      expect(entry1?.variables).toBeUndefined();

      // Then track with variables (e.g., from post-processor when translation is used)
      trackTranslation('User registered', 'user.registered', undefined, 'en', false, { userName: 'Charlie' });

      const map2 = getMemoryMap();
      const entry2 = map2?.get('User registered');

      // Variables should now be present
      expect(entry2?.variables).toEqual({ userName: 'Charlie' });
    });
  });

  describe('extractUserVariables', () => {
    it('should extract user variables from options', () => {
      const options = {
        userName: 'John Doe',
        age: 30,
        active: true,
        lng: 'en',
        ns: 'common',
      };

      const variables = extractUserVariables(options);
      expect(variables).toEqual({
        userName: 'John Doe',
        age: 30,
        active: true,
      });
    });

    it('should include count and context as user variables', () => {
      const options = {
        count: 5,
        context: 'male',
        lng: 'en',
      };

      const variables = extractUserVariables(options);
      expect(variables).toEqual({
        count: 5,
        context: 'male',
      });
    });

    it('should filter out i18next internal keys', () => {
      const options = {
        userName: 'Jane',
        defaultValue: 'Default',
        lng: 'en',
        ns: 'common',
        returnObjects: true,
        postProcess: ['uppercase'],
        interpolation: { escapeValue: false },
      };

      const variables = extractUserVariables(options);
      expect(variables).toEqual({
        userName: 'Jane',
      });
    });

    it('should filter out keys starting with underscore', () => {
      const options = {
        userName: 'Bob',
        _internal: 'value',
        __private: 'secret',
      };

      const variables = extractUserVariables(options);
      expect(variables).toEqual({
        userName: 'Bob',
      });
    });

    it('should return undefined when no user variables present', () => {
      const options = {
        lng: 'en',
        ns: 'common',
        defaultValue: 'Default',
      };

      const variables = extractUserVariables(options);
      expect(variables).toBeUndefined();
    });

    it('should return undefined when options is null or undefined', () => {
      expect(extractUserVariables(null)).toBeUndefined();
      expect(extractUserVariables(undefined)).toBeUndefined();
    });

    it('should return undefined when options is not an object', () => {
      expect(extractUserVariables('string' as any)).toBeUndefined();
      expect(extractUserVariables(123 as any)).toBeUndefined();
    });

    it('should handle complex nested variable values', () => {
      const options = {
        user: { name: 'Alice', id: 123 },
        items: ['a', 'b', 'c'],
        lng: 'en',
      };

      const variables = extractUserVariables(options);
      expect(variables).toEqual({
        user: { name: 'Alice', id: 123 },
        items: ['a', 'b', 'c'],
      });
    });

    it('should filter out undefined values', () => {
      const options = {
        userName: 'Sarah Johnson',
        amount: undefined,
        company: undefined,
        count: undefined,
        context: undefined,
        lng: 'en',
      };

      const variables = extractUserVariables(options);
      expect(variables).toEqual({
        userName: 'Sarah Johnson',
      });
    });

    it('should return undefined when all user variables are undefined', () => {
      const options = {
        amount: undefined,
        company: undefined,
        lng: 'en',
      };

      const variables = extractUserVariables(options);
      expect(variables).toBeUndefined();
    });
  });
});
