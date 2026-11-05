import { describe, it, expect } from 'vitest';
import {
  ProfilePinSchema,
  WorkflowStatusSchema,
  ManuscriptInfoSchema,
  ManuscriptRecordSchema,
} from '../src/schemas';
import type {
  ProfilePin,
  WorkflowStatus,
  ManuscriptInfo,
  ManuscriptRecord,
  Manuscript,
} from '../src/types';

describe('ManuscriptRecord & ManuscriptInfo Models (PDF Spec 3.6 & 5.1d)', () => {
  describe('WorkflowStatusSchema', () => {
    it('validates standard 5 workflow statuses', () => {
      const statuses: WorkflowStatus[] = [
        'draft',
        'in-review',
        'proofing',
        'ready',
        'published',
      ];
      for (const s of statuses) {
        expect(WorkflowStatusSchema.parse(s)).toBe(s);
      }
    });

    it('rejects invalid workflow status', () => {
      expect(() => WorkflowStatusSchema.parse('invalid-status')).toThrow();
    });
  });

  describe('ProfilePinSchema', () => {
    it('validates 3-tier version pins and optional environmentId', () => {
      const pin: ProfilePin = {
        base: 1,
        journal: 5,
        articleType: 2,
        environmentId: 'env_texlive_2024',
      };
      const parsed = ProfilePinSchema.parse(pin);
      expect(parsed.base).toBe(1);
      expect(parsed.journal).toBe(5);
      expect(parsed.articleType).toBe(2);
      expect(parsed.environmentId).toBe('env_texlive_2024');
    });

    it('validates pin without optional environmentId', () => {
      const pin = { base: 1, journal: 2, articleType: 1 };
      const parsed = ProfilePinSchema.parse(pin);
      expect(parsed.base).toBe(1);
      expect(parsed.environmentId).toBeUndefined();
    });

    it('rejects missing tier version numbers', () => {
      expect(() => ProfilePinSchema.parse({ base: 1, journal: 2 })).toThrow();
    });
  });

  describe('ManuscriptInfoSchema', () => {
    it('validates full ManuscriptInfo object', () => {
      const info: ManuscriptInfo = {
        id: '01HRB554S3ABCDEFG012345678',
        displayName: 'Nghiên cứu Helicobacter pylori',
        submissionId: 'ID630_HS',
        note: 'Bản gửi lần 2 sau phản biện',
        tags: ['y-sinh', 'vi-khuan'],
        workflowStatus: 'in-review',
        pinned: true,
        archived: false,
        color: '#0f766e',
        source: {
          fileName: 'bai_bao_mau.docx',
          importedAt: '2026-11-05T10:00:00Z',
          sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        },
        ownerId: 'usr_001',
        createdAt: '2026-11-05T09:00:00Z',
        updatedAt: '2026-11-05T10:30:00Z',
        lastOpenedAt: '2026-11-05T10:30:00Z',
      };

      const parsed = ManuscriptInfoSchema.parse(info);
      expect(parsed.id).toBe(info.id);
      expect(parsed.displayName).toBe('Nghiên cứu Helicobacter pylori');
      expect(parsed.submissionId).toBe('ID630_HS');
      expect(parsed.workflowStatus).toBe('in-review');
      expect(parsed.pinned).toBe(true);
      expect(parsed.archived).toBe(false);
      expect(parsed.tags).toEqual(['y-sinh', 'vi-khuan']);
      expect(parsed.source?.fileName).toBe('bai_bao_mau.docx');
    });

    it('validates minimal ManuscriptInfo with defaults', () => {
      const minimal = {
        id: '01HRB554S3ABCDEFG012345678',
        displayName: 'Untitled Document',
        workflowStatus: 'draft',
        pinned: false,
        archived: false,
        createdAt: '2026-11-05T09:00:00Z',
        updatedAt: '2026-11-05T09:00:00Z',
      };

      const parsed = ManuscriptInfoSchema.parse(minimal);
      expect(parsed.displayName).toBe('Untitled Document');
      expect(parsed.tags).toEqual([]);
      expect(parsed.pinned).toBe(false);
      expect(parsed.archived).toBe(false);
    });
  });

  describe('ManuscriptRecordSchema', () => {
    it('validates ManuscriptRecord combining info and doc', () => {
      const minimalDoc: Manuscript = {
        schemaVersion: 2,
        id: '01HRB554S3ABCDEFG012345678',
        lang: 'vi',
        journalId: 'hs',
        articleType: 'research',
        meta: {
          title: [{ t: 'text', v: 'Tựa đề bài báo' }],
          authors: [],
          affiliations: [],
          abstract: [],
          keywords: ['khoa học'],
          dates: {},
        },
        body: [],
        back: [],
        references: [],
        assets: {},
        profilePin: {
          base: 1,
          journal: 1,
          articleType: 1,
        },
      };

      const record: ManuscriptRecord = {
        info: {
          id: minimalDoc.id,
          displayName: 'Tựa đề bài báo',
          workflowStatus: 'draft',
          pinned: false,
          archived: false,
          tags: [],
          createdAt: '2026-11-05T09:00:00Z',
          updatedAt: '2026-11-05T09:00:00Z',
        },
        doc: minimalDoc,
        revision: 1,
      };

      const parsed = ManuscriptRecordSchema.parse(record);
      expect(parsed.info.id).toBe(minimalDoc.id);
      expect(parsed.doc.journalId).toBe('hs');
      expect(parsed.doc.profilePin?.base).toBe(1);
      expect(parsed.revision).toBe(1);
    });
  });
});
