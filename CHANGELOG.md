# @jovandyaz/llm-router

## 0.2.0

### Minor Changes

- c137e71: Ship ESM only, with `/chain`, `/catalog`, `/guard` and `/tokens` subpath exports so importing the chain no longer loads the tokenizer or the model snapshot. The root entry still re-exports everything. Requires Node.js 22.12 or later; CommonJS consumers keep working through `require(esm)`, and TypeScript on `moduleResolution: node` resolves the subpaths through `typesVersions`. The CommonJS build added in 0.1.2 is gone.

### Patch Changes

- 486fe2c: Publish the bundled model index as `data/model-index.json`, a versioned document with a JSON Schema (`data/model-index.schema.json`), both exported as subpaths. Add `parseModelIndexDocument` to validate a document and `fetchModelIndex` to download the latest published index on request; nothing fetches on its own. `MODEL_INDEX_SNAPSHOT` and `MODEL_INDEX_SNAPSHOT_DATE` are unchanged.
- 72809d1: Refresh the bundled model index (569 models, generated 2026-11-17).

## 0.1.2

### Patch Changes

- f670cad: Ship a CommonJS build next to the ESM one, with per-condition types, so `require()` consumers and TypeScript projects on `moduleResolution: node` can use the package.

## 0.1.1

### Patch Changes

- 646e3cb: Expose `package.json` through `exports` so tools that read it (bundlers, `require.resolve`) can.
