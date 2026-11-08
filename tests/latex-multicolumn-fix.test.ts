import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawnSync } from 'node:child_process';
import { parseDocxFile } from '../apps/web/src/lib/docx-parser';
import { generateFullJournalLatex } from '../apps/web/src/lib/latex-template';

describe('Task 1: LaTeX Multicolumn Alignment Fix', () => {
  const rootDir = path.resolve(__dirname, '..');
  const templateDocxPath = path.resolve(
    rootDir,
    'docs/StandardTemplate/Bài mẫu template tiếng Việt.docx'
  );
  const tectonicBin = path.resolve(
    rootDir,
    'bin',
    process.platform === 'win32' ? 'tectonic.exe' : 'tectonic'
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'structpaper-multicol-test-'));

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('parses standard template docx and generates LaTeX with lowercase multicolumn alignments', async () => {
    expect(fs.existsSync(templateDocxPath)).toBe(true);
    expect(fs.existsSync(tectonicBin)).toBe(true);

    const buffer = fs.readFileSync(templateDocxPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    const parsedPaper = await parseDocxFile(arrayBuffer, path.basename(templateDocxPath));
    expect(parsedPaper).toBeDefined();

    const latex = generateFullJournalLatex(parsedPaper);
    expect(latex).toBeDefined();
    expect(latex.length).toBeGreaterThan(100);

    // Multicolumn alignment assertions
    const multicolMatches = [...latex.matchAll(/\\multicolumn\{(\d+)\}\{([^}]+)\}/g)];
    expect(multicolMatches.length).toBeGreaterThan(0);

    for (const match of multicolMatches) {
      const align = match[2];
      expect(['l', 'c', 'r']).toContain(align);
      expect(align).not.toMatch(/[LCR]/);
    }

    expect(latex).not.toMatch(/\\multicolumn\{\d+\}\{[LCR]\}/);

    // Compile with Tectonic to verify valid XeTeX output
    const texPath = path.join(tempDir, 'article.tex');
    fs.writeFileSync(texPath, latex, 'utf8');

    const result = spawnSync(tectonicBin, [texPath, '-o', tempDir, '--untrusted'], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.status !== 0) {
      console.error('Tectonic stdout:', result.stdout);
      console.error('Tectonic stderr:', result.stderr);
    }

    expect(result.status).toBe(0);

    const pdfPath = path.join(tempDir, 'article.pdf');
    expect(fs.existsSync(pdfPath)).toBe(true);
    const stat = fs.statSync(pdfPath);
    expect(stat.size).toBeGreaterThan(5000);

    // Verify PDF header magic bytes
    const headerBuf = Buffer.alloc(5);
    const fd = fs.openSync(pdfPath, 'r');
    fs.readSync(fd, headerBuf, 0, 5, 0);
    fs.closeSync(fd);
    expect(headerBuf.toString('ascii')).toBe('%PDF-');
  }, 60000);
});
