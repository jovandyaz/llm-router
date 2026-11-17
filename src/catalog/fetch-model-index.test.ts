import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { DEFAULT_MODEL_INDEX_URL, fetchModelIndex } from './fetch-model-index';

const SNAPSHOT_JSON = readFileSync(
  resolve(import.meta.dirname, '../../data/model-index.json'),
  'utf8'
);
const URL = 'https://example.test/model-index.json';

function respondWith(body: string, status = 200): typeof fetch {
  return async () => new Response(body, { status });
}

describe('fetchModelIndex', () => {
  it('returns the parsed document', async () => {
    const requested: string[] = [];
    const document = await fetchModelIndex({
      url: URL,
      fetch: async (input) => {
        requested.push(String(input));
        return new Response(SNAPSHOT_JSON);
      },
    });
    expect(requested).toEqual([URL]);
    expect(document.models.length).toBeGreaterThan(0);
  });

  it('defaults to the published package on jsDelivr', async () => {
    const requested: string[] = [];
    await fetchModelIndex({
      fetch: async (input) => {
        requested.push(String(input));
        return new Response(SNAPSHOT_JSON);
      },
    });
    expect(requested).toEqual([DEFAULT_MODEL_INDEX_URL]);
    expect(DEFAULT_MODEL_INDEX_URL).toMatch(
      /^https:\/\/cdn\.jsdelivr\.net\/npm\/@jovandyaz\/llm-router@\d+\.\d+\/data\/model-index\.json$/
    );
  });

  it('throws on HTTP 503 naming the url and status', async () => {
    await expect(
      fetchModelIndex({ url: URL, fetch: respondWith('busy', 503) })
    ).rejects.toThrow(`${URL} failed: HTTP 503`);
  });

  it('cancels the body of a non-2xx response', async () => {
    let cancelled = false;
    const body = new ReadableStream({
      cancel() {
        cancelled = true;
      },
    });
    await expect(
      fetchModelIndex({
        url: URL,
        fetch: async () => new Response(body, { status: 503 }),
      })
    ).rejects.toThrow(`${URL} failed: HTTP 503`);
    expect(cancelled).toBe(true);
  });

  it('throws when the body breaks the schema', async () => {
    await expect(
      fetchModelIndex({
        url: URL,
        fetch: respondWith(JSON.stringify({ schemaVersion: 1, models: 'x' })),
      })
    ).rejects.toThrow(z.ZodError);
  });

  it('aborts after timeoutMs', async () => {
    const neverResponds: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(init.signal?.reason)
        );
      });
    await expect(
      fetchModelIndex({ url: URL, fetch: neverResponds, timeoutMs: 10 })
    ).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('aborts when the caller signal fires', async () => {
    const controller = new AbortController();
    const neverResponds: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(init.signal?.reason)
        );
      });
    const pending = fetchModelIndex({
      url: URL,
      fetch: neverResponds,
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});
