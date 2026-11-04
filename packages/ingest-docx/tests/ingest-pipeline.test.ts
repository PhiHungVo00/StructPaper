import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import {
  IngestPipeline,
  calculateConfidence,
  registerLegacyFallbackParser,
} from '../src/pipeline';
import { ingestWorkerApi } from '../src/worker/ingest-worker';
import type { Manuscript } from '@structpaper/doc-model';

const FIXTURES_DIR = path.resolve(__dirname, '../../../fixtures/golden');

describe('Task 3.4: IngestPipeline & Fallback Mechanism', () => {
  describe('calculateConfidence', () => {
    it('computes weighted score: Title 30%, Authors 30%, Sections 20%, Tables 20%', () => {
      const fullDoc: Manuscript = {
        schemaVersion: 2,
        id: 'doc-1',
        lang: 'vi',
        journalId: 'vnuhcm-hs',
        articleType: 'research-article',
        meta: {
          title: [{ t: 'text', v: 'Tiêu đề bài báo' }],
          authors: [{ id: 'a1', name: 'Nguyễn Văn A', affiliationIds: [] }],
          affiliations: [],
          abstract: [[{ t: 'text', v: 'Tóm tắt bài báo' }]],
          keywords: ['k1'],
          dates: {},
        },
        body: [
          {
            id: 's1',
            level: 1,
            title: [{ t: 'text', v: '1. Mở đầu' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p1',
                content: [{ t: 'text', v: 'Nội dung.' }],
              },
            ],
            children: [],
          },
        ],
        back: [],
        references: [],
        assets: {},
      };

      const scores = calculateConfidence(fullDoc);

      expect(scores.title).toBe(1.0);
      expect(scores.authors).toBe(1.0);
      expect(scores.sections).toBe(1.0);
      expect(scores.tables).toBe(1.0); // No tables in rawDoc means 1.0
      expect(scores.overall).toBe(1.0);
    });

    it('penalizes missing title (-30%) and missing authors (-30%)', () => {
      const partialDoc: Manuscript = {
        schemaVersion: 2,
        id: 'doc-1',
        lang: 'en',
        journalId: 'vnuhcm-hs',
        articleType: 'research-article',
        meta: {
          title: [],
          authors: [],
          affiliations: [],
          abstract: [],
          keywords: [],
          dates: {},
        },
        body: [
          {
            id: 's1',
            level: 1,
            title: [{ t: 'text', v: '1. Intro' }],
            blocks: [{ type: 'paragraph', id: 'p1', content: [{ t: 'text', v: 'Text' }] }],
            children: [],
          },
        ],
        back: [],
        references: [],
        assets: {},
      };

      const scores = calculateConfidence(partialDoc);

      expect(scores.title).toBe(0.0);
      expect(scores.authors).toBe(0.0);
      expect(scores.sections).toBe(1.0);
      expect(scores.overall).toBe(0.4); // 0.2 sections + 0.2 tables = 0.4
    });
  });

  describe('IngestPipeline execution', () => {
    it('successfully processes Template_EN.docx with high confidence', async () => {
      const filePath = path.resolve(FIXTURES_DIR, 'templates/Template_EN.docx');
      const buffer = fs.readFileSync(filePath);

      const pipeline = new IngestPipeline();
      const result = await pipeline.ingest(buffer, {
        fileName: 'Template_EN.docx',
      });

      expect(result.manuscript).toBeDefined();
      expect(result.manuscript.schemaVersion).toBe(2);
      expect(result.manuscript.lang).toBe('en');
      expect(result.report.success).toBe(true);
      expect(result.report.confidence.overall).toBeGreaterThanOrEqual(0.85);
      expect(result.report.usedFallback).toBe(false);
      expect(result.report.stats.sectionsCount).toBeGreaterThan(0);
      expect(result.report.stats.tablesCount).toBeGreaterThanOrEqual(1);
    });

    it('triggers fallback parser when confidence is below threshold', async () => {
      const filePath = path.resolve(FIXTURES_DIR, 'templates/Template_EN.docx');
      const buffer = fs.readFileSync(filePath);

      let fallbackCalled = false;
      const mockLegacyParser = async () => {
        fallbackCalled = true;
        return {
          id: 'legacy-doc',
          metadata: {
            title: 'Fallback Paper Title',
            authors: [{ id: 1, name: 'Fallback Author' }],
            abstract: 'Fallback Abstract',
          },
          sections: [
            { id: 's1', heading: 'Fallback Section', content: 'Fallback Content' },
          ],
          references: [],
        };
      };

      const pipeline = new IngestPipeline();
      // Set a threshold above 1.0 (e.g. 1.01) to force fallback
      const result = await pipeline.ingest(buffer, {
        minConfidenceThreshold: 1.01,
        legacyParser: mockLegacyParser,
      });

      expect(fallbackCalled).toBe(true);
      expect(result.report.usedFallback).toBe(true);
      expect(result.report.fallbackReason).toContain('Confidence score');
      expect(result.manuscript.meta.title).toEqual([
        { t: 'text', v: 'Fallback Paper Title' },
      ]);
      expect(result.manuscript.meta.authors[0].name).toBe('Fallback Author');
    });

    it('works via ingestWorkerApi', async () => {
      const filePath = path.resolve(FIXTURES_DIR, 'templates/Template_VI.docx');
      const buffer = fs.readFileSync(filePath);

      const result = await ingestWorkerApi.ingest(buffer, {
        fileName: 'Template_VI.docx',
      });

      expect(result.manuscript).toBeDefined();
      expect(result.manuscript.schemaVersion).toBe(2);
      expect(result.manuscript.lang).toBe('vi');
      expect(result.report.confidence.overall).toBeGreaterThanOrEqual(0.85);
    });
  });
});
