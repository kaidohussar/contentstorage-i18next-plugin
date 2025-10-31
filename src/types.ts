/**
 * Entry in the memory map that tracks translation metadata
 */
export interface MemoryMapEntry {
  /** Set of translation keys (content IDs) that map to this value */
  ids: Set<string>;
  /** Type of content - always 'text' for translations */
  type: 'text';
  /** Optional metadata for debugging */
  metadata?: {
    /** Namespace where this translation was found */
    namespace?: string;
    /** Language code */
    language?: string;
    /** Timestamp when tracked */
    trackedAt?: number;
  };
}

/**
 * Global memory map for translation tracking
 * Maps translation values to their content IDs
 */
export type MemoryMap = Map<string, MemoryMapEntry>;

/**
 * Window interface extended with ContentStorage properties
 */
export interface ContentStorageWindow extends Window {
  memoryMap?: MemoryMap;
  __contentStorageDebug?: boolean;
}

/**
 * Plugin configuration options
 */
export interface ContentStoragePluginOptions {
  /**
   * Your ContentStorage content key
   * Used to construct CDN URLs for fetching translations
   */
  contentKey?: string;

  /**
   * Custom CDN base URL
   * @default 'https://cdn.contentstorage.app'
   */
  cdnBaseUrl?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Maximum number of entries in memoryMap
   * When exceeded, oldest entries are removed
   * @default 10000
   */
  maxMemoryMapSize?: number;

  /**
   * Custom function to load translations
   * If provided, overrides the default CDN loading
   */
  loadPath?: string | ((language: string, namespace: string) => string);

  /**
   * Custom fetch implementation
   * Useful for adding auth headers or custom logic
   */
  request?: (
    url: string,
    options: RequestInit
  ) => Promise<any>;

  /**
   * Query parameter name for live editor detection
   * @default 'contentstorage_live_editor'
   */
  liveEditorParam?: string;

  /**
   * Allow manual override of live editor mode
   * Useful for testing
   */
  forceLiveMode?: boolean;

  /**
   * Namespaces to track
   * If specified, only these namespaces will be tracked
   * If not specified, all namespaces are tracked
   */
  trackNamespaces?: string[];
}

/**
 * Translation data structure
 * Can be a nested object with string values
 */
export type TranslationData = {
  [key: string]: string | TranslationData;
};

/**
 * Callback for i18next backend read method
 */
export type ReadCallback = (
  error: Error | null,
  data: TranslationData | boolean | null | undefined
) => void;
