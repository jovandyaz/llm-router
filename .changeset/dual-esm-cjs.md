---
'@jovandyaz/llm-router': patch
---

Ship a CommonJS build next to the ESM one, with per-condition types, so `require()` consumers and TypeScript projects on `moduleResolution: node` can use the package.
