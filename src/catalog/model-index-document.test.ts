import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  MODEL_INDEX_SNAPSHOT,
  MODEL_INDEX_SNAPSHOT_DATE,
  modelIndexDocumentSchema,
  parseModelIndexDocument,
  renderModelIndexDocument,
  renderModelIndexSchema,
} from './model-index-document';

const DATA_DIR = resolve(import.meta.dirname, '../../data');

function readData(file: string): unknown {
  return JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf8'));
}

function snapshotDocument(): Record<string, unknown> {
  return readData('model-index.json') as Record<string, unknown>;
}

describe('model index document', () => {
  it('the bundled snapshot satisfies the schema', () => {
    const document = parseModelIndexDocument(snapshotDocument());
    expect(document.models.length).toBeGreaterThan(0);
    const ids = document.models.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
  });

  it('exposes the snapshot rows and date', () => {
    const document = parseModelIndexDocument(snapshotDocument());
    expect(MODEL_INDEX_SNAPSHOT).toEqual(document.models);
    expect(MODEL_INDEX_SNAPSHOT_DATE).toBe(document.generatedAt);
    expect(MODEL_INDEX_SNAPSHOT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('the snapshot file is exactly what the refresh writer renders', () => {
    const file = readFileSync(resolve(DATA_DIR, 'model-index.json'), 'utf8');
    expect(
      renderModelIndexDocument(parseModelIndexDocument(JSON.parse(file)))
    ).toBe(file);
  });

  it('published JSON Schema allows fields it does not know', () => {
    expect(renderModelIndexSchema()).not.toContain(
      '"additionalProperties": false'
    );
  });

  it('parses a document with an unknown field on a row and on the root', () => {
    const document = snapshotDocument();
    const [first, ...rest] = document.models as Record<string, unknown>[];
    const parsed = parseModelIndexDocument({
      ...document,
      publisher: 'someone',
      models: [{ ...first, tieredPricing: [] }, ...rest],
    });
    expect(parsed).not.toHaveProperty('publisher');
    expect(parsed.models[0]).not.toHaveProperty('tieredPricing');
  });

  it('rejects an unknown schemaVersion', () => {
    expect(() =>
      parseModelIndexDocument({ ...snapshotDocument(), schemaVersion: 2 })
    ).toThrow(z.ZodError);
  });

  it('rejects a row with a negative cost', () => {
    const document = snapshotDocument();
    const [first, ...rest] = document.models as Record<string, unknown>[];
    expect(() =>
      parseModelIndexDocument({
        ...document,
        models: [{ ...first, inputCostPerToken: -1 }, ...rest],
      })
    ).toThrow(z.ZodError);
  });

  it('published JSON Schema matches the zod schema', () => {
    expect(renderModelIndexSchema()).toBe(
      readFileSync(resolve(DATA_DIR, 'model-index.schema.json'), 'utf8')
    );
    expect(renderModelIndexSchema()).toBe(
      `${JSON.stringify(z.toJSONSchema(modelIndexDocumentSchema, { io: 'input' }), null, 2)}\n`
    );
  });
});
