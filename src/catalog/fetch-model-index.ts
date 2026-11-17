import {
  parseModelIndexDocument,
  type ModelIndexDocument,
} from './model-index-document';

/** The index shipped by the latest published 0.2.x release, served by jsDelivr from npm. */
export const DEFAULT_MODEL_INDEX_URL =
  'https://cdn.jsdelivr.net/npm/@jovandyaz/llm-router@0.2/data/model-index.json';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchModelIndexOptions {
  /** Defaults to `DEFAULT_MODEL_INDEX_URL`. */
  readonly url?: string | undefined;
  /** Defaults to the global `fetch`. */
  readonly fetch?: typeof fetch | undefined;
  readonly signal?: AbortSignal | undefined;
  /** Defaults to 10 seconds. */
  readonly timeoutMs?: number | undefined;
}

/**
 * Downloads and validates a model index document. Nothing calls it for you: the package never
 * touches the network on its own. Throws on a non-2xx response, a timeout, an abort or a
 * document that breaks the schema, and never returns partial data; falling back to
 * `MODEL_INDEX_SNAPSHOT` is the caller's decision.
 */
export async function fetchModelIndex(
  options: FetchModelIndexOptions = {}
): Promise<ModelIndexDocument> {
  const url = options.url ?? DEFAULT_MODEL_INDEX_URL;
  const fetchFn = options.fetch ?? globalThis.fetch;
  const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signal =
    options.signal === undefined
      ? timeout
      : AbortSignal.any([options.signal, timeout]);

  const response = await fetchFn(url, { signal });
  if (!response.ok) {
    throw new Error(
      `Model index request to ${url} failed: HTTP ${response.status}`
    );
  }
  return parseModelIndexDocument(await response.json());
}
