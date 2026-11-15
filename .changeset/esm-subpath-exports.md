---
'@jovandyaz/llm-router': minor
---

Ship ESM only, with `/chain`, `/catalog`, `/guard` and `/tokens` subpath exports so importing the chain no longer loads the tokenizer or the model snapshot. The root entry still re-exports everything. Requires Node.js 22.12 or later; CommonJS consumers keep working through `require(esm)`, and TypeScript on `moduleResolution: node` resolves the subpaths through `typesVersions`. The CommonJS build added in 0.1.2 is gone.
