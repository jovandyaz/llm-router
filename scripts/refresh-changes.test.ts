import { describe, expect, it } from 'vitest';

import { MODEL_INDEX_SNAPSHOT } from '../src/catalog';
import type { ModelIndexDocument } from '../src/catalog';
import { changesetFor, modelsChanged } from './refresh-changes';

const current: ModelIndexDocument = {
  schemaVersion: 1,
  generatedAt: '2026-11-09',
  sources: ['models.dev', 'openrouter'],
  models: MODEL_INDEX_SNAPSHOT.slice(0, 3),
};

describe('modelsChanged', () => {
  it('ignores a document that only moves the date', () => {
    expect(
      modelsChanged(current, { ...current, generatedAt: '2026-11-16' })
    ).toBe(false);
  });

  it('sees a changed price', () => {
    const [first, ...rest] = current.models;
    if (first === undefined) {
      throw new Error('the snapshot has no models');
    }
    const repriced = {
      ...current,
      models: [{ ...first, inputCostPerToken: 1 }, ...rest],
    };
    expect(modelsChanged(current, repriced)).toBe(true);
  });

  it('sees a removed model', () => {
    expect(
      modelsChanged(current, { ...current, models: current.models.slice(1) })
    ).toBe(true);
  });

  it('treats a missing previous document as changed', () => {
    expect(modelsChanged(null, current)).toBe(true);
  });
});

describe('changesetFor', () => {
  it('releases a patch named after the refresh day', () => {
    const changeset = changesetFor({ ...current, generatedAt: '2026-11-16' });
    expect(changeset.fileName).toBe('refresh-model-index-2026-11-16.md');
    expect(changeset.content).toBe(
      "---\n'@jovandyaz/llm-router': patch\n---\n\nRefresh the bundled model index (3 models, generated 2026-11-16).\n"
    );
  });
});
