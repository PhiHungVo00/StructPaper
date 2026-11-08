import { describe, it, expect } from 'vitest';
import { parseLatexLog } from '../src/wasm/log-parser';

describe('packages/compiler-client - parseLatexLog', () => {
  it('handles empty log input gracefully', () => {
    const report = parseLatexLog('');
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.overfullHbox).toBe(0);
    expect(report.underfullHbox).toBe(0);
    expect(report.missingFonts).toEqual([]);
    expect(report.missingReferences).toEqual([]);
    expect(report.missingPackages).toEqual([]);
    expect(report.missingImages).toEqual([]);
  });

  it('handles array of log strings or multiline string', () => {
    const lines = [
      'This is XeTeX, Version 3.141592653-2.6-0.999995',
      'Output written on main.pdf (1 page).',
    ];
    const reportFromArr = parseLatexLog(lines);
    const reportFromStr = parseLatexLog(lines.join('\n'));
    expect(reportFromArr.errors).toHaveLength(0);
    expect(reportFromStr.errors).toHaveLength(0);
  });

  it('extracts fatal/syntax errors and line numbers', () => {
    const sampleLog = `
This is XeTeX, Version 3.141592653
(./main.tex
! Undefined control sequence.
l.42 \\invalidCommand
                    {arg}
The control sequence at the end of the top line
of your error message was never \\def'ed.

! LaTeX Error: Environment customEnv undefined.
l.65 \\begin{customEnv}
                       
Output written on main.pdf (0 pages).
`;

    const report = parseLatexLog(sampleLog);
    expect(report.errors.length).toBe(2);
    expect(report.errors[0]).toMatchObject({
      line: 42,
      message: '! Undefined control sequence.',
      severity: 'error',
    });
    expect(report.errors[1]).toMatchObject({
      line: 65,
      message: '! LaTeX Error: Environment customEnv undefined.',
      severity: 'error',
    });
  });

  it('extracts missing LaTeX packages and reports them in missingPackages', () => {
    const log = `
! LaTeX Error: File \`fontspec.sty' not found.
<read *> 
l.12 \\usepackage{fontspec}
*** (cannot \`\\read\' from terminal in nonstop modes)
! LaTeX Error: File 'amsmath.sty' not found.
`;

    const report = parseLatexLog(log);
    expect(report.missingPackages).toContain('fontspec.sty');
    expect(report.missingPackages).toContain('amsmath.sty');
    expect(report.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts missing fonts and fontspec errors', () => {
    const log = `
kpathsea: Running mktextfm TimesNewRoman
kpathsea: Running mktexmf TimesNewRoman
! Font \\TU/TimesNewRoman(0)/m/n/10=TimesNewRoman at 10.0pt not loadable: Metric (TFM) file or installed font not found.
Package fontspec Error: The font "MinionPro" cannot be found.
`;

    const report = parseLatexLog(log);
    expect(report.missingFonts).toContain('TimesNewRoman');
    expect(report.missingFonts).toContain('MinionPro');
  });

  it('extracts undefined citations and cross-references into missingReferences and warnings', () => {
    const log = `
LaTeX Warning: Reference \`fig:overview' on page 2 undefined on input line 45.
LaTeX Warning: Citation \`einstein1905' on page 1 undefined on input line 23.
LaTeX Warning: Reference 'sec:methods' on page 3 undefined on input line 89.
LaTeX Warning: There were undefined references.
`;

    const report = parseLatexLog(log);
    expect(report.missingReferences).toContain('fig:overview');
    expect(report.missingReferences).toContain('einstein1905');
    expect(report.missingReferences).toContain('sec:methods');
    expect(report.warnings.length).toBeGreaterThanOrEqual(3);
    const refWarn = report.warnings.find((w) => w.line === 45);
    expect(refWarn).toBeDefined();
    expect(refWarn?.message).toContain('Reference');
  });

  it('extracts missing images into missingImages', () => {
    const log = `
! LaTeX Error: File \`figures/chart.png' not found.
<to be read again> 
l.55 \\includegraphics{figures/chart.png}
Package pdftex.def Error: File 'assets/logo.jpg' not found: using draft setting.
`;

    const report = parseLatexLog(log);
    expect(report.missingImages).toContain('figures/chart.png');
    expect(report.missingImages).toContain('assets/logo.jpg');
  });

  it('counts overfull and underfull \\hbox and \\vbox correctly', () => {
    const log = `
Overfull \\hbox (12.3pt too wide) in paragraph at lines 50--55
Overfull \\hbox (4.8pt too wide) in paragraph at lines 70--72
Underfull \\hbox (badness 10000) in paragraph at lines 20--22
Overfull \\vbox (8.2pt too high) has occurred while \\output is active
`;

    const report = parseLatexLog(log);
    expect(report.overfullHbox).toBe(2);
    expect(report.underfullHbox).toBe(1);
    expect(report.warnings.some((w) => w.message.includes('Overfull \\hbox'))).toBe(true);
    expect(report.warnings.some((w) => w.message.includes('Underfull \\hbox'))).toBe(true);
  });

  it('maps errors to blockId when texSource with %% BLOCK: <id> comments is provided', () => {
    const texSource = [
      '\\documentclass{article}',
      '%% BLOCK: block-metadata',
      '\\title{Test Paper}',
      '\\author{Author Name}',
      '%% BLOCK: block-intro',
      '\\begin{document}',
      '\\maketitle',
      '\\section{Introduction}',
      '\\invalidCommand', // Line 9 (1-indexed)
      'Text inside intro.',
      '%% BLOCK: block-conclusion',
      '\\section{Conclusion}',
      '\\anotherInvalid', // Line 13 (1-indexed)
      '\\end{document}',
    ].join('\n');

    const sampleLog = `
! Undefined control sequence.
l.9 \\invalidCommand

! Undefined control sequence.
l.13 \\anotherInvalid
`;

    const report = parseLatexLog(sampleLog, texSource);
    expect(report.errors).toHaveLength(2);
    expect(report.errors[0].line).toBe(9);
    expect(report.errors[0].blockId).toBe('block-intro');
    expect(report.errors[1].line).toBe(13);
    expect(report.errors[1].blockId).toBe('block-conclusion');
  });
});
