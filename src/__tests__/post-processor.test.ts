import { ContentstorageLiveEditorPostProcessor } from '../post-processor';
import { getMemoryMap, getCurrentLanguageCode } from '../utils';

describe('ContentstorageLiveEditorPostProcessor', () => {
  let postProcessor: ContentstorageLiveEditorPostProcessor;

  beforeEach(() => {
    // Clean up memory map and language code
    const win = window as any;
    delete win.memoryMap;
    delete win.currentLanguageCode;

    // Create post processor in forced live mode
    postProcessor = new ContentstorageLiveEditorPostProcessor({
      forceLiveMode: true,
      debug: false,
    });
  });

  describe('Language Code Tracking', () => {
    it('should initialize currentLanguageCode in constructor', () => {
      const currentLang = getCurrentLanguageCode();
      expect(currentLang).toBeDefined();
      expect(currentLang).not.toBeNull();
      expect(typeof currentLang).toBe('string');
    });

    it('should set currentLanguageCode when processing translation with lng option', () => {
      const options = {
        userName: 'John Doe',
        lng: 'fr',
      };

      postProcessor.process(
        'John Doe registered',
        'user.registered',
        options,
        {}
      );

      expect(getCurrentLanguageCode()).toBe('fr');
    });

    it('should set currentLanguageCode from translator.language when lng not in options', () => {
      const mockTranslator = {
        language: 'es',
      };

      postProcessor.process(
        'Usuario registrado',
        'user.registered',
        {},
        mockTranslator
      );

      expect(getCurrentLanguageCode()).toBe('es');
    });

    it('should update currentLanguageCode when language changes', () => {
      // First translation in English
      postProcessor.process(
        'Hello',
        'greeting',
        { lng: 'en' },
        {}
      );
      expect(getCurrentLanguageCode()).toBe('en');

      // Second translation in French
      postProcessor.process(
        'Bonjour',
        'greeting',
        { lng: 'fr' },
        {}
      );
      expect(getCurrentLanguageCode()).toBe('fr');
    });

    it('should not change currentLanguageCode when language is undefined', () => {
      // Set initial language
      postProcessor.process(
        'Hello',
        'greeting',
        { lng: 'en' },
        {}
      );
      expect(getCurrentLanguageCode()).toBe('en');

      // Process translation without language
      postProcessor.process(
        'World',
        'world',
        {},
        {}
      );

      // Should remain 'en'
      expect(getCurrentLanguageCode()).toBe('en');
    });
  });

  describe('Variable Tracking', () => {
    it('should track translation with variables', () => {
      const options = {
        userName: 'John Doe',
        lng: 'en',
      };

      const result = postProcessor.process(
        'John Doe registered',
        'user.registered',
        options,
        {}
      );

      expect(result).toBe('John Doe registered');

      const memoryMap = getMemoryMap();
      const entry = memoryMap?.get('John Doe registered');

      expect(entry).toBeDefined();
      expect(entry?.ids.has('user.registered')).toBe(true);
      expect(entry?.variables).toEqual({ userName: 'John Doe' });
    });

    it('should track template with placeholders when translator has resourceStore', () => {
      const options = {
        userName: 'Alice',
        lng: 'en',
      };

      // Mock translator with resourceStore
      const mockTranslator = {
        language: 'en',
        options: { defaultNS: 'translation' },
        resourceStore: {
          getResource: (_lng: string, _ns: string, key: string) => {
            if (key === 'user.greeting') {
              return '{{userName}} logged in'; // Return template with placeholder
            }
            return null;
          },
        },
      };

      const result = postProcessor.process(
        'Alice logged in', // Resolved value
        'user.greeting',
        options,
        mockTranslator
      );

      expect(result).toBe('Alice logged in');

      const memoryMap = getMemoryMap();
      // Should track with template, not resolved value
      const entry = memoryMap?.get('{{userName}} logged in');

      expect(entry).toBeDefined();
      expect(entry?.ids.has('user.greeting')).toBe(true);
      expect(entry?.variables).toEqual({ userName: 'Alice' });
    });
  });

  describe('Non-Live Mode', () => {
    it('should not track translations or set language when not in live mode', () => {
      // Clean up from previous tests
      const win = window as any;
      delete win.memoryMap;
      delete win.currentLanguageCode;

      const normalPostProcessor = new ContentstorageLiveEditorPostProcessor({
        forceLiveMode: false,
      });

      const options = {
        userName: 'Test User',
        lng: 'en',
      };

      const result = normalPostProcessor.process(
        'Test User registered',
        'user.registered',
        options,
        {}
      );

      expect(result).toBe('Test User registered');

      // MemoryMap and currentLanguageCode should not be initialized when not in live mode
      const memoryMap = getMemoryMap();
      expect(memoryMap).toBeNull();
      expect(getCurrentLanguageCode()).toBeNull();
    });
  });

  describe('Key Handling', () => {
    it('should handle array of keys (fallback keys)', () => {
      postProcessor.process(
        'Bob registered',
        ['user.registered', 'fallback.key'],
        { userName: 'Bob', lng: 'en' },
        {}
      );

      const memoryMap = getMemoryMap();
      const entry = memoryMap?.get('Bob registered');

      expect(entry?.ids.has('user.registered')).toBe(true);
      expect(entry?.variables).toEqual({ userName: 'Bob' });
    });

    it('should handle namespace in key with colon notation', () => {
      postProcessor.process(
        'Alice registered',
        'users:registered',
        { userName: 'Alice', lng: 'en' },
        {}
      );

      const memoryMap = getMemoryMap();
      const entry = memoryMap?.get('Alice registered');

      // Key should be normalized to dot notation
      expect(entry?.ids.has('users.registered')).toBe(true);
      expect(entry?.variables).toEqual({ userName: 'Alice' });
    });
  });
});
