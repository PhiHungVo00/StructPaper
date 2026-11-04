import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  generateBenchmarkLatexSource,
  benchmarkTectonic,
  benchmarkXeLatex,
  evaluateWasmCompiler,
  runSpike,
} from '../scripts/spikes/latex-engine-spike';

describe('Task 2.1: LaTeX Engine Spike', () => {
  const rootDir = path.resolve(__dirname, '..');
  const tectonicBin = path.join(
    rootDir,
    'bin',
    process.platform === 'win32' ? 'tectonic.exe' : 'tectonic'
  );

  it('generates benchmark LaTeX source with Vietnamese text, math, tables, figures', () => {
    const source = generateBenchmarkLatexSource();

    // Check Vietnamese text & diacritics
    expect(source).toContain('Nghiên cứu về vi khuẩn');
    expect(source).toContain('Helicobacter pylori');
    expect(source).toContain('ngang, huyền, sắc, hỏi, ngã, nặng');
    expect(source).toContain('ă, â, đ, ê, ô, ơ, ư');

    // Check math equations
    expect(source).toContain('\\begin{equation}');
    expect(source).toContain('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
    expect(source).toContain('\\text{FEV}_1');

    // Check table and figure
    expect(source).toContain('\\begin{table}');
    expect(source).toContain('\\begin{tabular}');
    expect(source).toContain('\\begin{figure}');
    expect(source).toContain('\\caption{');
  });

  it('detects bundled Tectonic binary in bin/ directory', () => {
    expect(fs.existsSync(tectonicBin)).toBe(true);
  });

  it('evaluates WasmCompiler feasibility accurately', () => {
    const wasm = evaluateWasmCompiler();
    expect(wasm.engine).toContain('WasmCompiler');
    expect(wasm.available).toBe(false);
    expect(wasm.recommendationRole).toBe('Future Spike / Client Preview');
    expect(wasm.memoryEstimateMb).toBeGreaterThanOrEqual(256);
    expect(wasm.coldCompileMs).toBeGreaterThan(wasm.warmCompileMs);
  });

  it('evaluates XeLaTeX fallback or local baseline', () => {
    const outputDir = path.join(rootDir, 'scripts/spikes/output');
    const sampleTex = path.join(outputDir, 'spike-sample.tex');
    const xelatex = benchmarkXeLatex(sampleTex, outputDir);
    expect(xelatex.engine).toContain('XeLaTeX');
    expect(xelatex.recommendationRole).toBe('Primary Server Engine');
    expect(xelatex.securityFlags).toContain('--no-shell-escape');
  });

  it('executes full benchmark spike and produces verified PDF and report JSON', () => {
    const report = runSpike();
    expect(report).toBeDefined();
    expect(report.engines.tectonic.available).toBe(true);
    expect(report.engines.tectonic.pdfVerified).toBe(true);
    expect(report.engines.tectonic.pdfSizeBytes).toBeGreaterThan(10000);
    expect(report.decisionSummary.primaryServer).toContain('XeLaTeX');
    expect(report.decisionSummary.offlineDev).toContain('Tectonic');

    const outputPdf = path.join(rootDir, 'scripts/spikes/output/spike-sample.pdf');
    expect(fs.existsSync(outputPdf)).toBe(true);
    const buf = Buffer.alloc(5);
    const fd = fs.openSync(outputPdf, 'r');
    fs.readSync(fd, buf, 0, 5, 0);
    fs.closeSync(fd);
    expect(buf.toString('ascii')).toBe('%PDF-');
  });
});
