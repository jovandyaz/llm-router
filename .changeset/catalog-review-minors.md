---
'@jovandyaz/llm-router': patch
---

`fetchModelIndex` releases the response body before throwing on a non-2xx status, and its default URL now follows the package's own major.minor. The published `model-index.schema.json` accepts fields it does not know, matching `parseModelIndexDocument`: adding a field keeps `schemaVersion`; removing, renaming or retyping one bumps it. The snapshot refresh validates the new index before writing it.
