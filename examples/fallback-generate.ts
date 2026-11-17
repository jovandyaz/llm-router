import assert from 'node:assert/strict';

import {
  executeWithChain,
  ProviderCooldownTracker,
  resolveChainCandidates,
  type RouterLogger,
} from '@jovandyaz/llm-router/chain';
import { generateText } from 'ai';

import { answering, overloadedModel } from './support/mock-models.ts';

const PRIMARY = 'anthropic:claude-sonnet-5';
const FALLBACK = 'openai:gpt-4.1';
const UNCONFIGURED = 'openrouter:deepseek/deepseek-v3.2';

const models = {
  [PRIMARY]: overloadedModel(PRIMARY),
  [FALLBACK]: answering(FALLBACK, ['Hello from OpenAI']),
};
type ModelId = keyof typeof models;
const isModelId = (model: string): model is ModelId => model in models;

const warnings: Record<string, unknown>[] = [];
const logger: RouterLogger = {
  warn: (payload) => warnings.push(payload),
  error: (payload) => warnings.push(payload),
};

const cooldown = new ProviderCooldownTracker(
  { allowedFails: 3, cooldownSeconds: 60 },
  logger
);

const candidates = resolveChainCandidates({
  primaryModel: PRIMARY,
  chain: [FALLBACK, UNCONFIGURED],
  isModelAvailable: isModelId,
  cooldown,
});

const answer = await executeWithChain(
  async (model) => {
    if (!isModelId(model)) {
      throw new Error(`no client for ${model}`);
    }
    // SDK retries would hit the overloaded provider again before the chain could fail over.
    const { text } = await generateText({
      model: models[model],
      prompt: 'Say hello.',
      maxRetries: 0,
    });
    return text;
  },
  { candidates, cooldown, logger }
);

assert.deepEqual(candidates, [PRIMARY, FALLBACK]);
assert.equal(answer, 'Hello from OpenAI');
assert.partialDeepStrictEqual(warnings, [
  { event: 'ai.chain.step_failed', model: PRIMARY, nextModel: FALLBACK },
]);
assert.equal(models[PRIMARY].doGenerateCalls.length, 1);
assert.equal(models[FALLBACK].doGenerateCalls.length, 1);
