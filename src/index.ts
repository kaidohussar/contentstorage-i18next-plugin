/**
 * @contentstorage/i18next-plugin
 *
 * i18next backend plugin for ContentStorage live editor translation tracking
 */

export { ContentStorageBackend, createContentStorageBackend } from './plugin';
export { ContentStoragePostProcessor, createContentStoragePostProcessor } from './post-processor';
export { debugMemoryMap, loadLiveEditorScript } from './utils';
export type {
  ContentStoragePluginOptions,
  MemoryMap,
  MemoryMapEntry,
  ContentStorageWindow,
  TranslationData,
} from './types';

// Default export for convenience
export { default } from './plugin';
