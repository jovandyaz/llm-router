import {
  parseModelIndexDocument,
  type ModelIndexDocument,
} from '../src/catalog';
import { renderModelIndexDocument } from '../src/catalog/model-index-document';

const PACKAGE_NAME = '@jovandyaz/llm-router';

export interface Changeset {
  readonly fileName: string;
  readonly content: string;
}

/** Whether a refresh changed any model row; a new `generatedAt` alone is not a change. */
export function modelsChanged(
  previous: ModelIndexDocument | null,
  next: ModelIndexDocument
): boolean {
  return (
    previous === null ||
    JSON.stringify(previous.models) !== JSON.stringify(next.models)
  );
}

/** A patch changeset for a refreshed index, so `^0.x` ranges pick the new data up. */
export function changesetFor(document: ModelIndexDocument): Changeset {
  return {
    fileName: `refresh-model-index-${document.generatedAt}.md`,
    content: `---\n'${PACKAGE_NAME}': patch\n---\n\nRefresh the bundled model index (${document.models.length} models, generated ${document.generatedAt}).\n`,
  };
}

export interface PreparedRefresh {
  readonly json: string;
  readonly changeset: Changeset;
}

/**
 * What a refresh should write, or `null` when no row changed. Validates `next` first and throws a
 * `ZodError` on a row that breaks the schema, so a bad document is never written.
 */
export function prepareRefresh(
  previous: ModelIndexDocument | null,
  next: ModelIndexDocument
): PreparedRefresh | null {
  if (!modelsChanged(previous, next)) {
    return null;
  }
  const document = parseModelIndexDocument(next);
  return {
    json: renderModelIndexDocument(document),
    changeset: changesetFor(document),
  };
}
