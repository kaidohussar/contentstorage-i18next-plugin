import type { PostProcessorModule } from 'i18next';
import type { ContentStoragePluginOptions } from './types';
import { trackTranslation, detectLiveEditorMode, initializeMemoryMap, loadLiveEditorScript } from './utils';

/**
 * ContentStorage Post-Processor
 *
 * This post-processor tracks translations at the point of resolution,
 * capturing the actual values returned by i18next including interpolations
 * and plural forms.
 *
 * Use this in addition to or instead of the backend plugin for more
 * comprehensive tracking, especially for dynamic translations.
 *
 * @example
 * ```typescript
 * import i18next from 'i18next';
 * import { ContentStoragePostProcessor } from '@contentstorage/i18next-plugin';
 *
 * i18next
 *   .use(new ContentStoragePostProcessor({ debug: true }))
 *   .init({
 *     // ... your config
 *   });
 * ```
 */
export class ContentStoragePostProcessor implements PostProcessorModule {
  static type: 'postProcessor' = 'postProcessor';
  type: 'postProcessor' = 'postProcessor';
  name: string = 'contentStorageTracker';

  private options: ContentStoragePluginOptions;
  private isLiveMode: boolean = false;

  constructor(options: ContentStoragePluginOptions = {}) {
    this.options = {
      debug: false,
      liveEditorParam: 'contentstorage_live_editor',
      forceLiveMode: false,
      ...options,
    };

    // Detect live editor mode
    this.isLiveMode = detectLiveEditorMode(
      this.options.liveEditorParam,
      this.options.forceLiveMode
    );

    if (this.isLiveMode) {
      initializeMemoryMap();

      // Load the live editor script
      loadLiveEditorScript(2, 3000, this.options.debug);

      if (this.options.debug) {
        console.log('[ContentStorage] Post-processor initialized in live mode');
      }
    }
  }

  /**
   * Process the translated value
   * Called by i18next after translation resolution
   */
  process(
    value: string,
    key: string | string[],
    options: any,
    translator: any
  ): string {
    // Only track in live mode
    if (!this.isLiveMode) {
      return value;
    }

    // Handle array of keys (fallback keys)
    const translationKey = Array.isArray(key) ? key[0] : key;

    // Only extract namespace if key explicitly uses colon notation
    // Don't pass namespace from options - let keys be clean by default
    let namespace: string | undefined;
    if (translationKey.includes(':')) {
      [namespace] = translationKey.split(':');
    }

    // Extract language
    const language = options?.lng || translator?.language;

    // Track the translation
    trackTranslation(
      value,
      translationKey,
      namespace,
      language,
      this.options.debug
    );

    return value;
  }
}

/**
 * Create a new instance of the ContentStorage post-processor
 */
export function createContentStoragePostProcessor(
  options?: ContentStoragePluginOptions
): ContentStoragePostProcessor {
  return new ContentStoragePostProcessor(options);
}
