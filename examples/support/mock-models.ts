import { APICallError, simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';

type GenerateResult = Awaited<ReturnType<MockLanguageModelV4['doGenerate']>>;

const OVERLOADED_STATUS = 529;
const TEXT_ID = 'text';
const STOP: GenerateResult['finishReason'] = { unified: 'stop', raw: 'stop' };
const USAGE: GenerateResult['usage'] = {
  inputTokens: { total: 12, noCache: 12, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 3, text: 3, reasoning: 0 },
};

function overloaded(modelId: string): APICallError {
  return new APICallError({
    message: `${modelId} is overloaded`,
    url: 'https://provider.test/v1/messages',
    requestBodyValues: {},
    statusCode: OVERLOADED_STATUS,
    isRetryable: true,
  });
}

/** A scripted model that answers `chunks`, joined for `generateText` or streamed for `streamText`. */
export function answering(
  modelId: string,
  chunks: readonly string[]
): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    modelId,
    doGenerate: async () => ({
      content: [{ type: 'text', text: chunks.join('') }],
      finishReason: STOP,
      usage: USAGE,
      warnings: [],
    }),
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: TEXT_ID },
          ...chunks.map((delta) => ({
            type: 'text-delta' as const,
            id: TEXT_ID,
            delta,
          })),
          { type: 'text-end', id: TEXT_ID },
          { type: 'finish', finishReason: STOP, usage: USAGE },
        ],
      }),
    }),
  });
}

/** A scripted model whose provider answers HTTP 529 to every call. */
export function overloadedModel(modelId: string): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    modelId,
    doGenerate: async () => {
      throw overloaded(modelId);
    },
    doStream: async () => {
      throw overloaded(modelId);
    },
  });
}
