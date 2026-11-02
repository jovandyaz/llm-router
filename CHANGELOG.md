# @jovandyaz/llm-router

## 0.1.2

### Patch Changes

- f670cad: Ship a CommonJS build next to the ESM one, with per-condition types, so `require()` consumers and TypeScript projects on `moduleResolution: node` can use the package.

## 0.1.1

### Patch Changes

- 646e3cb: Expose `package.json` through `exports` so tools that read it (bundlers, `require.resolve`) can.
