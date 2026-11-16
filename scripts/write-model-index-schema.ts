import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { renderModelIndexSchema } from '../src/catalog/model-index-document';

const SCHEMA_PATH = resolve(
  import.meta.dirname,
  '../data/model-index.schema.json'
);

await writeFile(SCHEMA_PATH, renderModelIndexSchema());
console.log(`Wrote ${SCHEMA_PATH}`);
