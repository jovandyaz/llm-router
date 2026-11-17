import assert from 'node:assert/strict';

import {
  ProviderCooldownTracker,
  streamWithChain,
  type RouterLogger,
} from '@jovandyaz/llm-router/chain';
import { streamText } from 'ai';

import { answering, overloadedModel } from './support/mock-models.ts';

const PRIMARY = 'anthropic:claude-sonnet-5';
const FALLBACK = 'openai:gpt-4.1';

const models = {
  [PRIMARY]: overloadedModel(PRIMARY),
  [FALLBACK]: answering(FALLBACK, ['Hel', 'lo ', 'world']),
};
type ModelId = keyof typeof models;
const isModelId = (model: string): model is ModelId => model in models;

const logger: RouterLogger = { warn: () => undefined, error: () => undefined };
const cooldown = new ProviderCooldownTracker(
  { allowedFails: 3, cooldownSeconds: 60 },
  logger
);
const signal = new AbortController().signal;
let settledUsage: PromiseLike<unknown> | undefined;

const textStream = streamWithChain({
  candidates: [PRIMARY, FALLBACK],
  cooldown,
  logger,
  open: (model) => {
    if (!isModelId(model)) {
      throw new Error(`no client for ${model}`);
    }
    return streamText({
      model: models[model],
      prompt: 'Say hello.',
      abortSignal: signal,
      maxRetries: 0,
      // The default handler logs every stream error, including the ones the chain recovers from.
      onError: () => undefined,
    });
  },
  chunks: async function* (stream) {
    // streamText never rejects on a failed connection; the failure arrives as an error part.
    for await (const part of stream.stream) {
      if (part.type === 'error') {
        throw part.error;
      }
      if (part.type === 'text-delta') {
        yield part.text;
      }
    }
  },
  isAborted: () => signal.aborted,
  onSettle: (stream) => {
    settledUsage = stream.usage;
  },
});

let text = '';
for await (const chunk of textStream) {
  text += chunk;
}

assert.equal(text, 'Hello world');
assert.deepEqual(await settledUsage, {
  inputTokens: 12,
  inputTokenDetails: {
    noCacheTokens: 12,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  },
  outputTokens: 3,
  outputTokenDetails: { textTokens: 3, reasoningTokens: 0 },
  totalTokens: 15,
});
