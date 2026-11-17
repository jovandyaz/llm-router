import { version } from '../../package.json' with { type: 'json' };
import {
  parseModelIndexDocument,
  type ModelIndexDocument,
} from './model-index-document';

/**
 * The jsDelivr version range for a package version: the minor line (`0.2.1` → `0.2`) for a stable
 * release, the exact version for a prerelease, whose line has no stable release to resolve to yet.
 */
export function releaseRangeOf(packageVersion: string): string {
  return packageVersion.includes('-')
    ? packageVersion
    : packageVersion.split('.').slice(0, 2).join('.');
}

/**
 * The index of the latest published release on this package's minor line (e.g. `@0.2` resolves to
 * the newest 0.2.x), served by jsDelivr from npm. Follows the package version on its own.
 */
export const DEFAULT_MODEL_INDEX_URL: `https://cdn.jsdelivr.net/npm/@jovandyaz/llm-router@${string}/data/model-index.json` = `https://cdn.jsdelivr.net/npm/@jovandyaz/llm-router@${releaseRangeOf(version)}/data/model-index.json`;

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
    // Release the connection instead of leaving the unread body to garbage collection. Best effort:
    // not awaited and never thrown, so a locked, errored or stuck body cannot replace the HTTP error.
    response.body?.cancel().catch(() => undefined);
    throw new Error(
      `Model index request to ${url} failed: HTTP ${response.status}`
    );
  }
  return parseModelIndexDocument(await response.json());
}
