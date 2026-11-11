import { describe, it, expect } from 'vitest';
import { splitMathSegments, asStandaloneEquation, checkLatexMath, hasMath } from '@/lib/math-text';
import { resolveTheme, DEFAULT_THEME, themeToCssVars, hexToRgb } from '@/lib/theme-config';

describe('math-text', () => {
  it('splits text/inline/display', () => {
    expect(splitMathSegments('a $x^2$ b $$y=1$$ c')).toEqual([
      { kind: 'text', value: 'a ' },
      { kind: 'inline', value: 'x^2' },
      { kind: 'text', value: ' b ' },
      { kind: 'display', value: 'y=1' },
      { kind: 'text', value: ' c' },
    ]);
  });
  it('treats a lone dollar as text', () => {
    expect(hasMath('giá 5$ mỗi cái')).toBe(false);
  });
  it('detects standalone display equation', () => {
    expect(asStandaloneEquation('  $$ E=mc^2 $$ ')).toBe('E=mc^2');
    expect(asStandaloneEquation('a $$E$$')).toBeNull();
  });
  it('validates structure', () => {
    expect(checkLatexMath('\\frac{a}{b}')).toBeNull();
    expect(checkLatexMath('\\frac{a}{b')).not.toBeNull();
    expect(checkLatexMath('\\left( x')).not.toBeNull();
    expect(checkLatexMath('')).not.toBeNull();
  });
});

describe('theme-config', () => {
  it('returns defaults with no overrides', () => {
    expect(resolveTheme(undefined)).toEqual(DEFAULT_THEME);
  });
  it('applies overrides and sanitises unsafe values', () => {
    const t = resolveTheme({
      theme: { titleColor: 'ff0000', tableHeaderColor: 'red;}', bodyFont: 'Arial}\\x', margins: { top: 99, left: 2 } },
    });
    expect(t.titleColor).toBe('#FF0000');
    expect(t.tableHeaderColor).toBe(DEFAULT_THEME.tableHeaderColor);
    expect(t.bodyFont).toBe(DEFAULT_THEME.bodyFont);
    expect(t.margins.top).toBe(6);
    expect(t.margins.left).toBe(2);
  });
  it('journal colour is used when no explicit title colour', () => {
    expect(resolveTheme(undefined, '#006838').titleColor).toBe('#006838');
  });
  it('emits css vars and rgb', () => {
    expect(themeToCssVars(DEFAULT_THEME)['--sp-title-color']).toBe('#2B74B7');
    expect(hexToRgb('#FF8000')).toEqual({ r: 255, g: 128, b: 0 });
  });
});
