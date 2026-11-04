import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import type { Manuscript } from '@structpaper/doc-model';
import { ZipPackager } from '../src/zip/zip-packager';

describe('ZipPackager', () => {
  const sampleManuscript: Manuscript = {
    schemaVersion: 2,
    id: 'test-paper-zip-01',
    lang: 'vi',
    journalId: 'vnuhcm-stdj',
    articleType: 'research-article',
    meta: {
      title: [{ t: 'text', v: 'Nghiên cứu về Khoa học Dữ liệu' }],
      authors: [
        {
          id: 'a1',
          name: 'Nguyễn Văn A',
          affiliationIds: ['aff1'],
          email: 'a.nv@example.com',
        },
      ],
      affiliations: [
        {
          id: 'aff1',
          institution: 'Đại học Quốc gia TP.HCM',
        },
      ],
      abstract: [[{ t: 'text', v: 'Tóm tắt bài báo mẫu.' }]],
      keywords: ['Khoa học dữ liệu', 'Học máy'],
      dates: { received: '2026-01-01', published: '2026-03-01' },
    },
    body: [
      {
        id: 'sec1',
        level: 1,
        title: [{ t: 'text', v: 'Giới thiệu' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p1',
            content: [{ t: 'text', v: 'Nội dung phần mở đầu.' }],
          },
          {
            type: 'figure',
            id: 'fig1',
            assetId: 'fig-chart-01',
            caption: [{ t: 'text', v: 'Biểu đồ phân phối' }],
            layout: { columnSpan: '1-column' },
          },
        ],
        children: [],
      },
    ],
    back: [],
    references: [],
    assets: {
      'fig-chart-01': {
        id: 'fig-chart-01',
        sha256: 'deadbeef123',
        mimeType: 'image/png',
        fileName: 'chart1.png',
      },
    },
  };

  it('generates a valid ZIP buffer containing all required submission artifacts', async () => {
    const packager = new ZipPackager();
    const fakeImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]); // PNG signature

    const zipBuffer = await packager.package(sampleManuscript, {
      assets: {
        'fig-chart-01': fakeImageBuffer,
      },
      includeDocx: true,
    });

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);
    expect(zipBuffer.length).toBeGreaterThan(1000);

    // Unzip and inspect files
    const unzipped = await JSZip.loadAsync(zipBuffer);

    // 1. manuscript.tex
    const texFile = unzipped.file('manuscript.tex');
    expect(texFile).toBeDefined();
    const texContent = await texFile!.async('string');
    expect(texContent).toContain('\\documentclass{structpaper-hs}');
    expect(texContent).toContain('Nghiên cứu về Khoa học Dữ liệu');

    // 2. structpaper-hs.cls
    const clsFile = unzipped.file('structpaper-hs.cls');
    expect(clsFile).toBeDefined();
    const clsContent = await clsFile!.async('string');
    expect(clsContent).toContain('\\ProvidesClass{structpaper-hs}');

    // 3. images/
    const imageFile = unzipped.file('images/chart1.png');
    expect(imageFile).toBeDefined();
    const imageBytes = await imageFile!.async('nodebuffer');
    expect(imageBytes[0]).toBe(0x89);
    expect(imageBytes[1]).toBe(0x50);

    // 4. metadata.json
    const metaFile = unzipped.file('metadata.json');
    expect(metaFile).toBeDefined();
    const metaJson = JSON.parse(await metaFile!.async('string'));
    expect(metaJson.id).toBe('test-paper-zip-01');
    expect(metaJson.journalId).toBe('vnuhcm-stdj');

    // 5. README.md
    const readmeFile = unzipped.file('README.md');
    expect(readmeFile).toBeDefined();
    const readmeContent = await readmeFile!.async('string');
    expect(readmeContent).toContain('StructPaper v2 Submission Bundle');
    expect(readmeContent).toContain('tectonic manuscript.tex');

    // 6. manuscript.xml (JATS)
    const xmlFile = unzipped.file('manuscript.xml');
    expect(xmlFile).toBeDefined();
    const xmlContent = await xmlFile!.async('string');
    expect(xmlContent).toContain('<article xmlns:xlink="http://www.w3.org/1999/xlink"');

    // 7. manuscript.docx
    const docxFile = unzipped.file('manuscript.docx');
    expect(docxFile).toBeDefined();
    const docxBytes = await docxFile!.async('nodebuffer');
    expect(docxBytes.length).toBeGreaterThan(500);
    expect(docxBytes[0]).toBe(0x50); // PK header
  });
});
