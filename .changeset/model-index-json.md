---
'@jovandyaz/llm-router': patch
---

Publish the bundled model index as `data/model-index.json`, a versioned document with a JSON Schema (`data/model-index.schema.json`), both exported as subpaths. Add `parseModelIndexDocument` to validate a document and `fetchModelIndex` to download the latest published index on request; nothing fetches on its own. `MODEL_INDEX_SNAPSHOT` and `MODEL_INDEX_SNAPSHOT_DATE` are unchanged.
