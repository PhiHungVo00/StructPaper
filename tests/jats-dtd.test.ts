import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseDocxFile } from '../apps/web/src/lib/docx-parser';
import { exportToJatsXml } from '../apps/web/src/lib/jats-export';

/**
 * Validates the XML export of every golden document against the official JATS 1.2 DTD.
 * Needs the DTD (python scripts/jats/fetch-dtd.py scripts/jats/dtd) and python + lxml;
 * otherwise the test is skipped.
 */
const root = path.resolve(__dirname, '..');
const dtd = path.join(root, 'scripts/jats/dtd/JATS-archivearticle1-mathml3.dtd');
const validator = path.join(root, 'scripts/jats/validate-jats.py');
const python = process.platform === 'win32' ? 'python' : 'python3';
const hasLxml = spawnSync(python, ['-c', 'import lxml'], { encoding: 'utf8' }).status === 0;
const runnable = fs.existsSync(dtd) && hasLxml;

const golden = (['papers', 'templates'] as const).flatMap((d) =>
  fs.existsSync(path.join(root, 'fixtures/golden', d))
    ? fs.readdirSync(path.join(root, 'fixtures/golden', d)).map((f) => ({ d, f }))
    : []
);

describe.skipIf(!runnable)('JATS XML export validates against the JATS 1.2 DTD', () => {
  for (const { d, f } of golden) {
    it(`${d}/${f}`, async () => {
      const buf = fs.readFileSync(path.join(root, 'fixtures/golden', d, f));
      const paper = await parseDocxFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, f);
      const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'jats-')), 'out.xml');
      fs.writeFileSync(tmp, exportToJatsXml(paper, { articleId: '1' }), 'utf8');
      const res = spawnSync(python, [validator, dtd, tmp], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      expect(res.stdout).toContain('VALID');
      expect(res.stdout).not.toContain('INVALID');
    }, 60000);
  }
});
