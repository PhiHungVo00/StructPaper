import { describe, it, expect } from 'vitest';
import {
  escapeTex,
  stripInvisibleChars,
  formatLatexKey,
} from '../src/latex/escape-tex';

describe('escapeTex and Sanitization Utilities', () => {
  it('escapes standard LaTeX reserved characters correctly in raw text', () => {
    const raw = '100% of A & B _ C # D {E} ~ F ^ G \\ H';
    const escaped = escapeTex(raw);

    expect(escaped).toContain('100\\%');
    expect(escaped).toContain('\\&');
    expect(escaped).toContain('\\_');
    expect(escaped).toContain('\\#');
    expect(escaped).toContain('\\{E\\}');
    expect(escaped).toContain('\\textasciitilde{}');
    expect(escaped).toContain('\\textasciicircum{}');
    expect(escaped).toContain('\\textbackslash{}');
  });

  it('preserves inline math formulas while escaping surrounding text', () => {
    const text = 'Nồng độ tăng 50% khi tính theo công thức $y = a \\times x + b$ trong mẫu $n = 100$.';
    const escaped = escapeTex(text);

    // Surrounding % is escaped
    expect(escaped).toContain('50\\%');
    // Math expressions are preserved intact
    expect(escaped).toContain('$y = a \\times x + b$');
    expect(escaped).toContain('$n = 100$');
    // Math backslash is NOT converted to textbackslash
    expect(escaped).not.toContain('$y = a \\textbackslash{}times');
  });

  it('preserves display math ($$...$$) expressions intact', () => {
    const text = 'Xem phương trình tổng quát:\n$$\\sum_{i=1}^{n} x_i = 100\\%$$\nvới độ tin cậy 95% & p < 0.05.';
    const escaped = escapeTex(text);

    expect(escaped).toContain('$$\\sum_{i=1}^{n} x_i = 100\\%$$');
    expect(escaped).toContain('95\\% \\& p < 0.05.');
  });

  it('escapes lone dollar signs when preserveMath is false or not matched', () => {
    const text = 'Giá thành là $100 và $200';
    const escaped = escapeTex(text, { preserveMath: false });
    expect(escaped).toBe('Giá thành là \\$100 và \\$200');
  });

  it('strips zero-width and invisible unicode characters', () => {
    const dirty = 'Chữ\u200B\u200C\u200D\uFEFF\u200E\u200FViệt';
    expect(stripInvisibleChars(dirty)).toBe('ChữViệt');
    expect(escapeTex(dirty)).toBe('ChữViệt');
  });

  it('formats safe LaTeX keys and label prefixes', () => {
    expect(formatLatexKey('fig 1.2/a', 'fig')).toBe('fig:fig_1_2_a');
    expect(formatLatexKey('ref-smith:2025')).toBe('ref-smith_2025');
    expect(formatLatexKey('', 'sec')).toBe('sec:item');
  });
});
