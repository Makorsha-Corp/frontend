import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { markupCopy } from './markupCopy';

const dir = dirname(fileURLToPath(import.meta.url));
const forbidden = /sign|approve|signature/i;

describe('markupCopy', () => {
  it('forbidden words absent from action labels', () => {
    const labels = [
      markupCopy.markModeLabel,
      markupCopy.penLabel,
      markupCopy.textLabel,
      markupCopy.panLabel,
      markupCopy.clearPageLabel,
      markupCopy.savingLabel,
      markupCopy.savedLabel,
      markupCopy.showOnlyMineLabel,
      markupCopy.resetViewLabel,
      markupCopy.undoLabel,
      markupCopy.loupeLabel,
      markupCopy.loupePlaceHint,
    ];
    for (const label of labels) {
      expect(label).not.toMatch(forbidden);
    }

    const editorSource = readFileSync(join(dir, 'MarkupEditor.tsx'), 'utf8');
    expect(editorSource).not.toMatch(/>\s*Sign\s*</i);
    expect(editorSource).not.toMatch(/>\s*Approve\s*</i);
    expect(editorSource).not.toMatch(/scribble/i);
  });
});
