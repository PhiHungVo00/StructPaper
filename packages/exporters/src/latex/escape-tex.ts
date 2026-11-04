/**
 * LaTeX Character Escaping & Sanitization Utilities
 *
 * Provides safe escaping of LaTeX reserved characters (% & _ # $ \ ^ { } ~)
 * while preserving valid inline/display math expressions.
 */

const LATEX_SPECIAL_CHAR_MAP: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  '%': '\\%',
  '&': '\\&',
  '_': '\\_',
  '#': '\\#',
  '$': '\\$',
  '^': '\\textasciicircum{}',
  '~': '\\textasciitilde{}',
};

const SPECIAL_CHAR_REGEX = /[\\{}%&#$_^~]/g;
const INVISIBLE_UNICODE_REGEX = /[\u200B\u200C\u200D\uFEFF\u200E\u200F]/g;
const MATH_BLOCK_REGEX = /(\$\$[\s\S]*?\$\$|\$[^\$\r\n]+?\$)/g;

export interface EscapeTexOptions {
  preserveMath?: boolean;
}

/**
 * Strips zero-width and invisible unicode characters that cause LaTeX compile errors.
 */
export function stripInvisibleChars(text: string): string {
  if (!text) return '';
  return text.replace(INVISIBLE_UNICODE_REGEX, '');
}

/**
 * Converts any arbitrary string / ID into a safe LaTeX label or citation key.
 * Allowed characters: ASCII alphanumeric, underscores, hyphens.
 */
export function formatLatexKey(id: string, prefix?: string): string {
  const sanitized = (id || 'item').replace(/[^a-zA-Z0-9_-]/g, '_');
  return prefix ? `${prefix}:${sanitized}` : sanitized;
}

/**
 * Escapes characters that have special meaning in LaTeX.
 * By default preserves inline ($...$) and display ($$...$$) math expressions.
 *
 * @param text The input raw string
 * @param options Escaping configuration options
 * @returns Escaped LaTeX string
 */
export function escapeTex(text: string, options: EscapeTexOptions = {}): string {
  if (!text) return '';

  const clean = stripInvisibleChars(text);
  const preserveMath = options.preserveMath !== false;

  if (!preserveMath) {
    return clean.replace(SPECIAL_CHAR_REGEX, (char) => LATEX_SPECIAL_CHAR_MAP[char] || char);
  }

  // Extract math segments to protect them from character escaping
  const mathSegments: string[] = [];
  const textWithTokens = clean.replace(MATH_BLOCK_REGEX, (match) => {
    mathSegments.push(match);
    return `@@SPMATH${mathSegments.length - 1}@@`;
  });

  // Escape special characters in non-math portions
  const escaped = textWithTokens.replace(
    SPECIAL_CHAR_REGEX,
    (char) => LATEX_SPECIAL_CHAR_MAP[char] || char
  );

  // Restore protected math segments
  return escaped.replace(/@@SPMATH(\d+)@@/g, (_, indexStr) => {
    const idx = parseInt(indexStr, 10);
    return mathSegments[idx] ?? '';
  });
}
