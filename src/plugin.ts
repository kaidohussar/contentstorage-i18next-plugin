import type {
  BackendModule,
  ReadCallback,
  Services,
  InitOptions,
} from 'i18next';
import type {
  ContentStoragePluginOptions,
  TranslationData,
} from './types';
import {
  detectLiveEditorMode,
  initializeMemoryMap,
  trackTranslation,
  cleanupMemoryMap,
  flattenTranslations,
  isBrowser,
} from './utils';

/**
 * ContentStorage i18next Backend Plugin
 *
 * This plugin enables translation tracking for the ContentStorage live editor
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
 * import ContentStorageBackend from '@contentstorage/i18next-plugin';
 *
 * i18next
 *   .use(ContentStorageBackend)
 *   .init({
 *     backend: {
 *       contentKey: 'your-content-key',
 *       debug: true
 *     }
 *   });
 * ```
 */
export class ContentStorageBackend implements BackendModule<ContentStoragePluginOptions> {
  static type: 'backend' = 'backend';
  type: 'backend' = 'backend';

  private options: ContentStoragePluginOptions;
  private isLiveMode: boolean = false;

  constructor(_services?: Services, options?: ContentStoragePluginOptions, _i18nextOptions?: InitOptions) {
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
    backendOptions: ContentStoragePluginOptions = {},
    i18nextOptions: InitOptions = {}
  ): void {
    // Store services and i18nextOptions for potential future use
    // Note: Currently not used but kept in signature for i18next compatibility
    void services;
    void i18nextOptions;

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

      if (this.options.debug) {
        console.log('[ContentStorage] Live editor mode enabled');
        console.log('[ContentStorage] Plugin initialized with options:', this.options);
      }
    } else if (this.options.debug) {
      console.log('[ContentStorage] Running in normal mode (not live editor)');
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

      trackTranslation(
        value,
        key,
        namespace,
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
 * Create a new instance of the ContentStorage backend
 */
export function createContentStorageBackend(
  options?: ContentStoragePluginOptions
): ContentStorageBackend {
  return new ContentStorageBackend(undefined, options);
}

// Default export
export default ContentStorageBackend;
