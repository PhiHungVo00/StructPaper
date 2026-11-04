import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseDocxFile } from '../apps/web/src/lib/docx-parser';

export interface BaselineFileMetrics {
  title: string;
  authorsLength: number;
  affiliationsLength: number;
  hasAbstract: boolean;
  abstractLength: number;
  sectionsLength: number;
  tablesLength: number;
  figuresLength: number;
  referencesLength: number;
}

export interface GoldenSnapshotItem {
  category: 'template' | 'paper';
  fileName: string;
  relativePath: string;
  fileSizeBytes: number;
  metrics: BaselineFileMetrics;
}

export interface GoldenSnapshotStore {
  version: '2.0.0';
  generator: 'legacy-docx-parser';
  generatedAt: string;
  totalFiles: number;
  templatesCount: number;
  papersCount: number;
  files: Record<string, GoldenSnapshotItem>;
}

const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.resolve(REPO_ROOT, 'fixtures/golden');
const SNAPSHOT_PATH = path.resolve(FIXTURES_DIR, 'baseline-snapshots.json');

export const GOLDEN_TEMPLATES = [
  'templates/Template_EN.docx',
  'templates/Template_VI.docx',
  'templates/Bài mẫu template tiếng Anh.docx',
  'templates/Bài mẫu template tiếng Việt.docx',
] as const;

export const GOLDEN_PAPERS = [
  'papers/ID630_HS-2026-10-02-06-42.docx',
  'papers/phlhuong,+Journal+editor,+1421.docx',
  'papers/eic_stdjelm,+Journal+editor,+3.+1750.docx',
  'papers/tranhien05,+Production+editor,+VNUHCM-EES+ID850+Copyedited.docx',
  'papers/tranhien05,+Journal+editor,+VNUHCM+-+HS+ID+722+copyedited.docx',
  'papers/[SSH]+ID+1102+copyedited+(4-2025).docx',
  'papers/1563-Fulltext-12989-1-15-20260326-20260622_V3.docx',
] as const;

export const ALL_GOLDEN_FILES = [
  ...GOLDEN_TEMPLATES.map((rel) => ({ rel, category: 'template' as const })),
  ...GOLDEN_PAPERS.map((rel) => ({ rel, category: 'paper' as const })),
];

export async function extractMetricsForFile(relativePath: string): Promise<BaselineFileMetrics> {
  const fullPath = path.resolve(FIXTURES_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Golden fixture file does not exist: ${fullPath}`);
  }
  const buffer = fs.readFileSync(fullPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;

  const fileName = path.basename(relativePath);
  const parsed = await parseDocxFile(arrayBuffer, fileName);

  const rawAbstract = parsed.metadata?.abstract || '';
  const cleanAbstract = rawAbstract.trim();

  return {
    title: parsed.metadata?.title?.trim() || '',
    authorsLength: parsed.metadata?.authors?.length || 0,
    affiliationsLength: parsed.metadata?.affiliations?.length || 0,
    hasAbstract: cleanAbstract.length > 0,
    abstractLength: cleanAbstract.length,
    sectionsLength: parsed.sections?.length || 0,
    tablesLength: parsed.sections?.filter((s) => s.type === 'table' || s.table)?.length || 0,
    figuresLength: parsed.sections?.filter((s) => s.type === 'figure' || s.figure)?.length || 0,
    referencesLength: parsed.references?.length || 0,
  };
}

describe('Task 0.4: Golden Fixtures & Baseline Characterization Test', () => {
  let snapshotStore: GoldenSnapshotStore | null = null;

  beforeAll(async () => {
    // If snapshot file does not exist, generate and persist it
    if (!fs.existsSync(SNAPSHOT_PATH)) {
      const generatedFiles: Record<string, GoldenSnapshotItem> = {};

      for (const item of ALL_GOLDEN_FILES) {
        const fullPath = path.resolve(FIXTURES_DIR, item.rel);
        const stats = fs.statSync(fullPath);
        const metrics = await extractMetricsForFile(item.rel);

        generatedFiles[item.rel] = {
          category: item.category,
          fileName: path.basename(item.rel),
          relativePath: item.rel,
          fileSizeBytes: stats.size,
          metrics,
        };
      }

      const store: GoldenSnapshotStore = {
        version: '2.0.0',
        generator: 'legacy-docx-parser',
        generatedAt: new Date().toISOString(),
        totalFiles: ALL_GOLDEN_FILES.length,
        templatesCount: GOLDEN_TEMPLATES.length,
        papersCount: GOLDEN_PAPERS.length,
        files: generatedFiles,
      };

      fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(store, null, 2), 'utf8');
      snapshotStore = store;
    } else {
      const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
      snapshotStore = JSON.parse(raw) as GoldenSnapshotStore;
    }
  });

  it('verifies that all 11 fixture files physically exist on disk', () => {
    expect(ALL_GOLDEN_FILES).toHaveLength(11);
    expect(GOLDEN_TEMPLATES).toHaveLength(4);
    expect(GOLDEN_PAPERS).toHaveLength(7);

    for (const item of ALL_GOLDEN_FILES) {
      const fullPath = path.resolve(FIXTURES_DIR, item.rel);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stats = fs.statSync(fullPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  it('strictly ensures "Yêu cầu phần mềm.docx" is excluded from golden fixtures', () => {
    const papersDir = path.resolve(FIXTURES_DIR, 'papers');
    const templatesDir = path.resolve(FIXTURES_DIR, 'templates');

    const paperFiles = fs.readdirSync(papersDir);
    const templateFiles = fs.readdirSync(templatesDir);

    const hasExcludedDocx = [...paperFiles, ...templateFiles].some(
      (f) => f.toLowerCase().includes('yêu cầu phần mềm') || f.toLowerCase().includes('yeu cau phan mem')
    );
    expect(hasExcludedDocx).toBe(false);
  });

  it('verifies baseline snapshot contains all 11 fixtures', () => {
    expect(snapshotStore).not.toBeNull();
    expect(snapshotStore?.totalFiles).toBe(11);
    expect(snapshotStore?.templatesCount).toBe(4);
    expect(snapshotStore?.papersCount).toBe(7);

    for (const item of ALL_GOLDEN_FILES) {
      expect(snapshotStore?.files[item.rel]).toBeDefined();
    }
  });

  describe('Characterization snapshot matching (Templates)', () => {
    for (const rel of GOLDEN_TEMPLATES) {
      it(`matches baseline snapshot for template: ${rel}`, async () => {
        const expected = snapshotStore?.files[rel];
        expect(expected).toBeDefined();

        const currentMetrics = await extractMetricsForFile(rel);
        expect(currentMetrics).toEqual(expected!.metrics);
      }, 30000);
    }
  });

  describe('Characterization snapshot matching (Papers)', () => {
    for (const rel of GOLDEN_PAPERS) {
      it(`matches baseline snapshot for paper: ${rel}`, async () => {
        const expected = snapshotStore?.files[rel];
        expect(expected).toBeDefined();

        const currentMetrics = await extractMetricsForFile(rel);
        expect(currentMetrics).toEqual(expected!.metrics);
      }, 30000);
    }
  });
});
