// Mirrors a CommonJS app on `moduleResolution: node`, which ignores `exports`.
import { MODEL_INDEX_SNAPSHOT, type IndexedModel } from '@jovandyaz/llm-router';
import { ModelIndexCatalog } from '@jovandyaz/llm-router/catalog';
import { providerOf, type RouterLogger } from '@jovandyaz/llm-router/chain';
import { detectPromptInjection } from '@jovandyaz/llm-router/guard';
import { estimateTokenCount } from '@jovandyaz/llm-router/tokens';

const rows: readonly IndexedModel[] = MODEL_INDEX_SNAPSHOT;
const catalog = new ModelIndexCatalog(rows);
const provider: string = providerOf('anthropic:claude-sonnet-5');
const safe: boolean = detectPromptInjection('hello').safe;
const tokens: number = estimateTokenCount('hello');
const logger: RouterLogger = { warn: () => undefined, error: () => undefined };

export { catalog, logger, provider, safe, tokens };
