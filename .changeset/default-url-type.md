---
'@jovandyaz/llm-router': patch
---

`DEFAULT_MODEL_INDEX_URL` is typed as a jsDelivr URL template again instead of a bare `string`, and a prerelease version points it at its own exact version, since jsDelivr cannot resolve the minor line until a stable release exists.
