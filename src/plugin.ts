import type {
  BackendModule,
  ReadCallback,
  Services,
  InitOptions,
} from 'i18next';
import type {
  ContentstoragePluginOptions,
  TranslationData,
} from './types';
import {
  detectLiveEditorMode,
  initializeMemoryMap,
  trackTranslation,
  cleanupMemoryMap,
  flattenTranslations,
  isBrowser,
  loadLiveEditorScript,
  setCurrentLanguageCode,
} from './utils';
import { ContentstorageLiveEditorPostProcessor } from './post-processor';

/**
 * Contentstorage i18next Backend Plugin
 *
 * This plugin enables translation tracking for the Contentstorage live editor
 * by maintaining a memory map of translations and their keys.
 *
 * Features:
 * - Automatic live editor mode detection
 * - Translation tracking with memory map
 * - Support for nested translations
 * - Memory management with size limits
 * - Custom CDN or load path support
 *
 * @example
 * ```typescript
 * import i18next from 'i18next';
 * import ContentstorageBackend from '@contentstorage/i18next-plugin';
 *
 * i18next
 *   .use(ContentstorageBackend)
 *   .init({
 *     backend: {
 *       contentKey: 'your-content-key',
 *       debug: true
 *     }
 *   });
 * ```
 */
export class ContentstorageBackend implements BackendModule<ContentstoragePluginOptions> {
  static type: 'backend' = 'backend';
  type: 'backend' = 'backend';

  private options: ContentstoragePluginOptions;
  private isLiveMode: boolean = false;
  private postProcessor?: ContentstorageLiveEditorPostProcessor;
  private i18nextInstance?: any;

  constructor(_services?: Services, options?: ContentstoragePluginOptions, _i18nextOptions?: InitOptions) {
    this.options = options || {};

    // Initialize if services and i18nextOptions are provided
    // This allows i18next to initialize the plugin automatically
    if (_services && _i18nextOptions) {
      this.init(_services, options, _i18nextOptions);
    }
  }

  /**
   * Initialize the plugin
   * Called by i18next during initialization
   */
  init(
    services: Services,
    backendOptions: ContentstoragePluginOptions = {},
    i18nextOptions: InitOptions = {}
  ): void {

    this.options = {
      debug: false,
      maxMemoryMapSize: 10000,
      liveEditorParam: 'contentstorage_live_editor',
      forceLiveMode: false,
      ...backendOptions,
    };

    // Detect live editor mode
    this.isLiveMode = detectLiveEditorMode(
      this.options.liveEditorParam,
      this.options.forceLiveMode
    );

    if (this.isLiveMode) {
      // Initialize memory map
      initializeMemoryMap();

      // Store i18next instance for language change tracking
      this.i18nextInstance = (services as any).i18next || (services as any).backendConnector?.backend?.options?.i18next;

      // Set up language change tracking
      this.setupLanguageTracking(services);

      // Load the live editor script
      loadLiveEditorScript(2, 3000, this.options.debug, this.options.customLiveEditorScriptUrl).then((loaded) => {
        if (loaded) {
          if (this.options.debug) {
            console.log('[ContentStorage] Live editor ready');
          }
        } else {
          console.warn('[ContentStorage] Failed to load live editor script');
        }
      });

      // Auto-register the post-processor for live editor tracking
      this.registerPostProcessor(services, i18nextOptions);

      if (this.options.debug) {
        console.log('[ContentStorage] Live editor mode enabled');
        console.log('[ContentStorage] Post-processor auto-registered');
        console.log('[ContentStorage] Plugin initialized with options:', this.options);
      }
    } else if (this.options.debug) {
      console.log('[ContentStorage] Running in normal mode (not live editor)');
    }
  }

  /**
   * Set up language change tracking
   * Listens to i18next language changes and updates window.currentLanguageCode
   */
  private setupLanguageTracking(services: Services): void {
    if (!isBrowser()) return;

    // Try to get the i18next instance from services
    const i18next = this.i18nextInstance || (services as any).backendConnector?.i18next;

    if (i18next) {
      // Set initial language code
      const initialLanguage = i18next.language || i18next.options?.lng || 'en';
      setCurrentLanguageCode(initialLanguage);

      if (this.options.debug) {
        console.log(`[ContentStorage] Setting initial language code: ${initialLanguage}`);
      }

      // Listen for language changes
      i18next.on('languageChanged', (lng: string) => {
        setCurrentLanguageCode(lng);
        if (this.options.debug) {
          console.log(`[ContentStorage] Language changed to: ${lng}`);
        }
      });

      if (this.options.debug) {
        console.log('[ContentStorage] Language change tracking enabled');
      }
    } else {
      // Fallback: try to detect i18next from window
      if (typeof window !== 'undefined' && (window as any).i18next) {
        const windowI18next = (window as any).i18next;
        const initialLanguage = windowI18next.language || 'en';
        setCurrentLanguageCode(initialLanguage);

        if (this.options.debug) {
          console.log(`[ContentStorage] Setting initial language code (from window): ${initialLanguage}`);
        }

        windowI18next.on('languageChanged', (lng: string) => {
          setCurrentLanguageCode(lng);
          if (this.options.debug) {
            console.log(`[ContentStorage] Language changed to: ${lng}`);
          }
        });
      } else if (this.options.debug) {
        console.warn('[ContentStorage] Could not access i18next instance for language tracking');
      }
    }
  }

  /**
   * Auto-register the live editor post-processor
   * This allows dynamic translation tracking without requiring explicit postProcess config
   */
  private registerPostProcessor(services: Services, i18nextOptions: InitOptions): void {
    // Create post-processor instance
    this.postProcessor = new ContentstorageLiveEditorPostProcessor(this.options);

    // Register with i18next
    services.languageUtils?.addPostProcessor(this.postProcessor);

    // Add to postProcess array if it exists, otherwise create it
    const initOptions = i18nextOptions as any;
    if (!initOptions.postProcess) {
      initOptions.postProcess = [];
    }

    // Ensure postProcess is an array
    if (!Array.isArray(initOptions.postProcess)) {
      initOptions.postProcess = [initOptions.postProcess];
    }

    // Add our post-processor if not already present
    if (!initOptions.postProcess.includes('contentstorage')) {
      initOptions.postProcess.push('contentstorage');
    }
  }

  /**
   * Read translations for a given language and namespace
   * This is the main method called by i18next to load translations
   */
  read(
    language: string,
    namespace: string,
    callback: ReadCallback
  ): void {
    if (this.options.debug) {
      console.log(`[ContentStorage] Loading translations: ${language}/${namespace}`);
    }

    this.loadTranslations(language, namespace)
      .then((translations) => {
        // Track translations if in live mode
        if (this.isLiveMode && this.shouldTrackNamespace(namespace)) {
          this.trackTranslations(translations, namespace, language);

          // Cleanup if needed
          if (this.options.maxMemoryMapSize) {
            cleanupMemoryMap(this.options.maxMemoryMapSize);
          }
        }

        callback(null, translations);
      })
      .catch((error) => {
        if (this.options.debug) {
          console.error('[ContentStorage] Failed to load translations:', error);
        }
        callback(error, false);
      });
  }

  /**
   * Load translations from CDN or custom source
   */
  private async loadTranslations(
    language: string,
    namespace: string
  ): Promise<TranslationData> {
    const url = this.getLoadPath(language, namespace);

    if (this.options.debug) {
      console.log(`[ContentStorage] Fetching from: ${url}`);
    }

    try {
      const fetchFn = this.options.request || this.defaultFetch.bind(this);
      return await fetchFn(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      if (this.options.debug) {
        console.error('[ContentStorage] Fetch error:', error);
      }
      throw error;
    }
  }

  /**
   * Default fetch implementation
   */
  private async defaultFetch(url: string, options: RequestInit): Promise<any> {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `Failed to load translations: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get the URL to load translations from
   */
  private getLoadPath(language: string, namespace: string): string {
    const { loadPath, contentKey } = this.options;

    // Custom load path function
    if (typeof loadPath === 'function') {
      return loadPath(language, namespace);
    }

    // Custom load path string with interpolation
    if (typeof loadPath === 'string') {
      return loadPath
        .replace('{{lng}}', language)
        .replace('{{ns}}', namespace);
    }

    // Default CDN path
    if (!contentKey) {
      throw new Error(
        '[ContentStorage] contentKey is required when using default CDN path'
      );
    }

    // Default: Always use uppercase language code
    const lng = language.toUpperCase();

    // Default: https://cdn.contentstorage.app/{contentKey}/content/{LNG}.json
    return `https://cdn.contentstorage.app/${contentKey}/content/${lng}.json`;
  }

  /**
   * Check if a namespace should be tracked
   */
  private shouldTrackNamespace(namespace: string): boolean {
    const { trackNamespaces } = this.options;

    // If no filter specified, track all namespaces
    if (!trackNamespaces || trackNamespaces.length === 0) {
      return true;
    }

    return trackNamespaces.includes(namespace);
  }

  /**
   * Track all translations in the loaded data
   */
  private trackTranslations(
    translations: TranslationData,
    namespace: string,
    language: string
  ): void {
    if (!isBrowser()) return;

    const flatTranslations = flattenTranslations(translations);

    for (const [key, value] of flatTranslations) {
      // Skip empty values
      if (!value) continue;

      // Don't pass namespace - let keys be tracked without prefix by default
      // Only keys with explicit colon notation (e.g., "common:welcome") will have namespace
      trackTranslation(
        value,
        key,
        undefined, // namespace not passed by default
        language,
        this.options.debug
      );
    }

    if (this.options.debug) {
      console.log(
        `[ContentStorage] Tracked ${flatTranslations.length} translations for ${namespace}`
      );
    }
  }
}

/**
 * Create a new instance of the Contentstorage backend
 */
export function createContentstorageBackend(
  options?: ContentstoragePluginOptions
): ContentstorageBackend {
  return new ContentstorageBackend(undefined, options);
}

// Default export
export default ContentstorageBackend;
