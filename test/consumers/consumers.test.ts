import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DIST = join(REPO_ROOT, 'dist');
const FIXTURE = join(import.meta.dirname, 'cjs-node10');
const TSC = join(REPO_ROOT, 'node_modules/typescript/bin/tsc');

/** Each public subpath and one value it must expose at runtime. */
const ENTRIES = [
  ['', 'executeWithChain'],
  ['/chain', 'executeWithChain'],
  ['/catalog', 'ModelIndexCatalog'],
  ['/guard', 'detectPromptInjection'],
  ['/tokens', 'estimateTokenCount'],
] as const;

const STATIC_IMPORT = /\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']/g;

/** Every file `entry` reaches through static imports, plus the bare specifiers they import. */
function importGraph(entry: string): {
  files: string[];
  packages: Set<string>;
} {
  const files: string[] = [];
  const packages = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop() as string;
    if (files.includes(file)) {
      continue;
    }
    files.push(file);
    for (const match of readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      const specifier = match[1] ?? match[2] ?? '';
      if (specifier.startsWith('.')) {
        pending.push(resolve(dirname(file), specifier));
      } else {
        packages.add(specifier);
      }
    }
  }
  return { files, packages };
}

describe('published package consumers', () => {
  let consumerDir = '';

  beforeAll(() => {
    if (!existsSync(join(DIST, 'index.mjs'))) {
      throw new Error(
        'dist/ is missing: run `pnpm build` before `pnpm test:consumers`'
      );
    }
    consumerDir = mkdtempSync(join(tmpdir(), 'llm-router-consumer-'));
    cpSync(FIXTURE, consumerDir, { recursive: true });
    mkdirSync(join(consumerDir, 'node_modules/@jovandyaz'), {
      recursive: true,
    });
    symlinkSync(
      REPO_ROOT,
      join(consumerDir, 'node_modules/@jovandyaz/llm-router'),
      'dir'
    );
  });

  afterAll(() => {
    if (consumerDir !== '') {
      rmSync(consumerDir, { recursive: true, force: true });
    }
  });

  it.each(ENTRIES)(
    'require() of "@jovandyaz/llm-router%s" loads',
    (subpath, exportName) => {
      const output = execFileSync(
        process.execPath,
        [
          '-e',
          `process.stdout.write(typeof require(${JSON.stringify(`@jovandyaz/llm-router${subpath}`)})[${JSON.stringify(exportName)}])`,
        ],
        { cwd: consumerDir, encoding: 'utf8' }
      );
      expect(output).toBe('function');
    }
  );

  it('chain does not reach the tokenizer, zod or the snapshot', () => {
    const { files, packages } = importGraph(join(DIST, 'chain.mjs'));
    expect([...packages]).not.toContain('gpt-tokenizer');
    expect([...packages]).not.toContain('zod');
    for (const file of files) {
      expect(readFileSync(file, 'utf8')).not.toContain('"claude-');
    }
  });

  it('a CommonJS consumer on moduleResolution node typechecks', () => {
    expect(() =>
      execFileSync(process.execPath, [TSC, '-p', consumerDir], {
        encoding: 'utf8',
        stdio: 'pipe',
      })
    ).not.toThrow();
  });
});
