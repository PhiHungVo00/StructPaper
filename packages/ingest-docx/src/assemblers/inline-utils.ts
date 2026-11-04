import type { Inline, InlineMark, TextInline } from '@structpaper/doc-model';
import type { RawParagraph, RawRun } from '../types/raw-doc';

/**
 * Converts RawRun[] into normalized Inline[] (TextInline with marks).
 */
export function runsToInlines(runs: RawRun[]): Inline[] {
  if (!runs || runs.length === 0) return [];

  const inlines: Inline[] = [];

  for (const run of runs) {
    if (!run.text) continue;

    const marks: InlineMark[] = [];
    if (run.bold) marks.push('b');
    if (run.italic) marks.push('i');
    if (run.sup) marks.push('sup');
    if (run.sub) marks.push('sub');
    if (run.code) marks.push('code');

    const item: TextInline = {
      t: 'text',
      v: run.text,
      ...(marks.length > 0 ? { marks } : {}),
    };
    inlines.push(item);
  }

  return inlines;
}

/**
 * Converts a RawParagraph into Inline[] representation.
 */
export function paragraphToInlines(paragraph: RawParagraph): Inline[] {
  if (paragraph.runs && paragraph.runs.length > 0) {
    const res = runsToInlines(paragraph.runs);
    if (res.length > 0) return res;
  }

  if (paragraph.rawText) {
    return [{ t: 'text', v: paragraph.rawText }];
  }

  return [];
}

/**
 * Extracts plain text from an Inline[] array.
 */
export function inlinesToPlainText(inlines: Inline[]): string {
  let text = '';
  for (const il of inlines) {
    if (il.t === 'text') {
      text += il.v;
    }
  }
  return text;
}

/**
 * Strips a leading regular expression prefix from the first TextInline in an Inline[].
 */
export function stripPrefixFromInlines(inlines: Inline[], pattern: RegExp): Inline[] {
  if (inlines.length === 0) return [];
  const first = inlines[0];
  if (first.t !== 'text') return inlines;

  const stripped = first.v.replace(pattern, '');
  if (stripped.length === 0) {
    return inlines.slice(1);
  }

  const updated: Inline = {
    ...first,
    v: stripped,
  };

  return [updated, ...inlines.slice(1)];
}
