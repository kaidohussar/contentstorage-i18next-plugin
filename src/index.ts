/**
 * @contentstorage/i18next-plugin
 *
 * i18next backend plugin for Contentstorage live editor translation tracking
 */

export { ContentstorageBackend, createContentstorageBackend } from './plugin';
export {
  ContentstorageLiveEditorPostProcessor,
  createContentstorageLiveEditorPostProcessor,
} from './post-processor';
export { debugMemoryMap, loadLiveEditorScript } from './utils';
export type {
  ContentstoragePluginOptions,
  MemoryMap,
  MemoryMapEntry,
  ContentstorageWindow,
  TranslationData,
} from './types';

// Default export for convenience
export { default } from './plugin';
