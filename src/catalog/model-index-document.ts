import { z } from 'zod';

import snapshotJson from '../../data/model-index.json' with { type: 'json' };
import {
  INDEX_PROVIDERS,
  INDEX_SOURCES,
  MAX_INT32,
  MODEL_STATUSES,
  type IndexedModel,
} from './indexed-model';

/**
 * Bumped when a change would break a reader of the previous version: removing, renaming or
 * retyping a field. Adding a field keeps the version; readers ignore fields they do not know,
 * and the published JSON Schema allows them.
 */
export const MODEL_INDEX_SCHEMA_VERSION = 1;

/** The model index as published in `data/model-index.json`. Costs are USD per token. */
export interface ModelIndexDocument {
  readonly schemaVersion: typeof MODEL_INDEX_SCHEMA_VERSION;
  /** The UTC day the index was generated, `YYYY-MM-DD`. */
  readonly generatedAt: string;
  /** Where the rows were read from, e.g. `models.dev`, `openrouter`. */
  readonly sources: readonly string[];
  readonly models: readonly IndexedModel[];
}

const calendarDate = z.iso.date();
const costPerToken = z.number().nonnegative().nullable();
const tokenLimit = z.number().int().nonnegative().max(MAX_INT32).nullable();

const indexedModelSchema = z.object({
  id: z.string().min(1),
  provider: z.enum(INDEX_PROVIDERS),
  name: z.string().min(1),
  family: z.string().nullable(),
  releasedAt: calendarDate.nullable(),
  status: z.enum(MODEL_STATUSES),
  toolCall: z.boolean().nullable(),
  structuredOutput: z.boolean().nullable(),
  inputModalities: z.array(z.string()),
  outputModalities: z.array(z.string()),
  inputCostPerToken: costPerToken,
  outputCostPerToken: costPerToken,
  cacheReadCostPerToken: costPerToken,
  cacheWriteCostPerToken: costPerToken,
  maxInputTokens: tokenLimit,
  maxOutputTokens: tokenLimit,
  reasoning: z
    .object({ levels: z.array(z.string()), mandatory: z.boolean() })
    .nullable(),
  canonical: z.string().min(1),
  openWeights: z.boolean().nullable(),
  retiresAt: calendarDate.nullable(),
  source: z.enum(INDEX_SOURCES),
});

export const modelIndexDocumentSchema = z.object({
  $schema: z.string().optional(),
  schemaVersion: z.literal(MODEL_INDEX_SCHEMA_VERSION),
  generatedAt: calendarDate,
  sources: z.array(z.string().min(1)).min(1),
  models: z.array(indexedModelSchema),
});

/** Validates an untrusted model index document. Throws a `ZodError` when it does not match the schema. */
export function parseModelIndexDocument(raw: unknown): ModelIndexDocument {
  const { $schema: _schema, ...document } = modelIndexDocumentSchema.parse(raw);
  return document;
}

const snapshot = parseModelIndexDocument(snapshotJson);

/** The model index bundled with this version of the package. */
export const MODEL_INDEX_SNAPSHOT: readonly IndexedModel[] = snapshot.models;

/** The UTC day the bundled snapshot was generated, `YYYY-MM-DD`. */
export const MODEL_INDEX_SNAPSHOT_DATE: string = snapshot.generatedAt;

/** `data/model-index.schema.json`, as `scripts/write-model-index-schema.ts` writes it. */
export function renderModelIndexSchema(): string {
  return `${JSON.stringify(z.toJSONSchema(modelIndexDocumentSchema, { io: 'input' }), null, 2)}\n`;
}

/** `data/model-index.json`, one row per line so refresh diffs stay readable. */
export function renderModelIndexDocument(document: ModelIndexDocument): string {
  const rows = document.models
    .map((row) => `    ${JSON.stringify(row)}`)
    .join(',\n');
  const head = {
    $schema: './model-index.schema.json',
    schemaVersion: document.schemaVersion,
    generatedAt: document.generatedAt,
    sources: document.sources,
  };
  return `${JSON.stringify(head, null, 2).slice(0, -2)},\n  "models": [\n${rows}\n  ]\n}\n`;
}
