import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { IngestPipeline } from '../src/pipeline/ingest-pipeline';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES_DIR = path.resolve(REPO_ROOT, 'fixtures/golden');

describe('Task 3.4: Golden Fixtures Extraction & Pipeline', () => {
  const pipeline = new IngestPipeline();

  describe('Standard Templates (StyleMapRecognizer - 100% confidence)', () => {
    it('extracts Template_EN.docx with 1.0 confidence and all sections/tables/figures', async () => {
      const filePath = path.resolve(FIXTURES_DIR, 'templates/Template_EN.docx');
      const buf = fs.readFileSync(filePath);
      const res = await pipeline.ingest(buf, { fileName: 'Template_EN.docx' });

      expect(res.report.confidence.overall).toBe(1.0);
      expect(res.report.usedFallback).toBe(false);
      expect(res.manuscript.meta.title.length).toBeGreaterThan(0);
      expect(res.manuscript.meta.authors.length).toBeGreaterThan(0);
      expect(res.manuscript.body.length).toBeGreaterThan(0);
      expect(res.report.stats.tablesCount).toBe(1);
      expect(res.report.stats.figuresCount).toBe(1);
    });

    it('extracts Template_VI.docx with 1.0 confidence and all sections/tables/figures', async () => {
      const filePath = path.resolve(FIXTURES_DIR, 'templates/Template_VI.docx');
      const buf = fs.readFileSync(filePath);
      const res = await pipeline.ingest(buf, { fileName: 'Template_VI.docx' });

      expect(res.report.confidence.overall).toBe(1.0);
      expect(res.report.usedFallback).toBe(false);
      expect(res.manuscript.meta.title.length).toBeGreaterThan(0);
      expect(res.manuscript.meta.authors.length).toBeGreaterThan(0);
      expect(res.manuscript.body.length).toBeGreaterThan(0);
      expect(res.report.stats.tablesCount).toBe(1);
      expect(res.report.stats.figuresCount).toBe(1);
    });
  });

  describe('Real Papers & Fallback Integration', () => {
    it('processes papers and reports confidence and extraction stats', async () => {
      const filePath = path.resolve(FIXTURES_DIR, 'papers/phlhuong,+Journal+editor,+1421.docx');
      const buf = fs.readFileSync(filePath);
      const res = await pipeline.ingest(buf, { fileName: 'phlhuong,+Journal+editor,+1421.docx' });

      expect(res.manuscript).toBeDefined();
      expect(res.report.stats.sectionsCount).toBeGreaterThan(0);
      expect(res.report.stats.figuresCount).toBeGreaterThan(0);
      expect(res.report.stats.tablesCount).toBeGreaterThan(0);
      expect(res.report.confidence.overall).toBeGreaterThan(0);
    });

    it('triggers fallback when confidence is below threshold and legacy parser is provided', async () => {
      const filePath = path.resolve(FIXTURES_DIR, 'papers/ID630_HS-2026-10-02-06-42.docx');
      const buf = fs.readFileSync(filePath);
      let legacyCalled = false;
      const mockLegacy = async () => {
        legacyCalled = true;
        return {
          metadata: { title: 'Legacy Title', authors: ['Legacy Author'] },
          sections: [{ title: 'Intro', content: 'Legacy content' }],
          references: [{ text: 'Ref 1' }],
        };
      };

      const res = await pipeline.ingest(buf, {
        fileName: 'ID630_HS-2026-10-02-06-42.docx',
        minConfidenceThreshold: 0.85,
        legacyParser: mockLegacy,
      });

      expect(legacyCalled).toBe(true);
      expect(res.report.usedFallback).toBe(true);
      expect(res.manuscript.meta.title[0]?.t).toBe('text');
    });
  });
});
