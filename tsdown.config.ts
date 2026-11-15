import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    chain: 'src/chain/index.ts',
    catalog: 'src/catalog/index.ts',
    guard: 'src/guard/index.ts',
    tokens: 'src/tokens/index.ts',
  },
  platform: 'node',
  dts: true,
  exports: true,
  failOnWarn: true,
});
