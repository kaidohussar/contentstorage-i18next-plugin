import type { PostProcessorModule } from 'i18next';
import type { ContentstoragePluginOptions } from './types';
import { trackTranslation, detectLiveEditorMode, initializeMemoryMap, loadLiveEditorScript, extractUserVariables } from './utils';

/**
 * Contentstorage Live Editor Post-Processor
 *
 * This post-processor enables live editor functionality by tracking translations
 * at the point of resolution, capturing the actual values returned by i18next
 * including interpolations and plural forms.
 *
 * Use this to enable click-to-edit functionality in the Contentstorage live editor.
 * It works in addition to or instead of the backend plugin for more comprehensive
 * tracking, especially for dynamic translations.
 *
 * @example
 * ```typescript
 * import i18next from 'i18next';
 * import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';
 *
 * i18next
 *   .use(new ContentstorageLiveEditorPostProcessor({ debug: true }))
 *   .init({
 *     postProcess: ['contentstorage']
 *   });
 * ```
 */
export class ContentstorageLiveEditorPostProcessor implements PostProcessorModule {
  static type: 'postProcessor' = 'postProcessor';
  type: 'postProcessor' = 'postProcessor';
  name: string = 'contentstorage';

  private options: ContentstoragePluginOptions;
  private isLiveMode: boolean = false;

  constructor(options: ContentstoragePluginOptions = {}) {
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
      loadLiveEditorScript(2, 3000, this.options.debug, this.options.customLiveEditorScriptUrl);

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

    // Extract user variables from options
    const variables = extractUserVariables(options);

    // Track the translation
    trackTranslation(
      value,
      translationKey,
      namespace,
      language,
      this.options.debug,
      variables
    );

    return value;
  }
}

/**
 * Create a new instance of the Contentstorage Live Editor post-processor
 */
export function createContentstorageLiveEditorPostProcessor(
  options?: ContentstoragePluginOptions
): ContentstorageLiveEditorPostProcessor {
  return new ContentstorageLiveEditorPostProcessor(options);
}
