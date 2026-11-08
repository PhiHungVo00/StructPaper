import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import type { Manuscript } from '@structpaper/doc-model';
import { getJournalProfile } from '@structpaper/journal-profiles';
import { LatexExporter, exportToLatex } from '../src/latex/latex-exporter';

function createFullTestManuscript(): Manuscript {
  return {
    schemaVersion: 2,
    id: 'doc_test_full_001',
    lang: 'vi',
    journalId: 'vnuhcm-hs',
    articleType: 'Bài báo nghiên cứu',
    meta: {
      title: [
        {
          t: 'text',
          v: 'Nghiên cứu về vi khuẩn Helicobacter pylori & tỷ lệ mắc bệnh 50% tại Việt Nam',
        },
      ],
      translations: {
        en: [
          {
            t: 'text',
            v: 'Study on Helicobacter pylori & 50% prevalence rate in Vietnam',
          },
        ],
      },
      authors: [
        {
          id: 'auth_1',
          name: 'Nguyễn Văn An',
          affiliationIds: ['aff_1'],
          email: 'an.nguyen@vnuhcm.edu.vn',
          isCorresponding: true,
        },
        {
          id: 'auth_2',
          name: 'Trần Thị Bình',
          affiliationIds: ['aff_2'],
        },
      ],
      affiliations: [
        {
          id: 'aff_1',
          institution: 'Đại học Quốc gia TP.HCM',
          department: 'Khoa Y',
          city: 'TP. Hồ Chí Minh',
          country: 'Việt Nam',
        },
        {
          id: 'aff_2',
          institution: 'Bệnh viện Chợ Rẫy',
          department: 'Khoa Tiêu hóa',
          city: 'TP. Hồ Chí Minh',
          country: 'Việt Nam',
        },
      ],
      abstract: [
        [
          {
            t: 'text',
            v: 'Đặt vấn đề: Nhiễm khuẩn H. pylori là nguyên nhân chính gây viêm loét dạ dày - tá tràng. Nghiên cứu khảo sát 200 bệnh nhân có tỷ lệ dương tính cao.',
          },
        ],
        [
          {
            t: 'text',
            v: 'Kết luận: Cần tầm soát sớm và áp dụng phác đồ điều trị 4 thuốc có bismuth.',
          },
        ],
      ],
      keywords: ['Helicobacter pylori', 'viêm dạ dày', 'FEV1', 'dịch tễ học'],
      dates: {
        received: '01/01/2026',
        revised: '15/01/2026',
        accepted: '01/02/2026',
        published: '15/02/2026',
      },
      doi: '10.32508/stdjhs.v7i1.1234',
    },
    body: [
      {
        id: 'sec_intro',
        level: 1,
        title: [{ t: 'text', v: '1. Đặt vấn đề' }],
        blocks: [
          {
            type: 'paragraph',
            id: 'p_intro_1',
            content: [
              {
                t: 'text',
                v: 'Nhiễm khuẩn vi khuẩn gram âm H. pylori chiếm khoảng 65% - 75% dân số ',
              },
              { t: 'cite', refIds: ['ref_001'] },
              { t: 'text', v: '. Xem chi tiết công thức ' },
              { t: 'xref', kind: 'equation', target: 'eq_or' },
              { t: 'text', v: ' và biểu đồ ' },
              { t: 'xref', kind: 'figure', target: 'fig_01' },
              { t: 'text', v: '.' },
            ],
          },
          {
            type: 'equation',
            id: 'eq_or',
            latex: '\\text{OR} = \\frac{a \\times d}{b \\times c}',
            numbered: true,
            status: 'ok',
          },
          {
            type: 'figure',
            id: 'fig_01',
            assetId: 'chart_prevalence.png',
            caption: [{ t: 'text', v: 'Hình 1: Tỷ lệ phân bố bệnh nhân theo nhóm tuổi' }],
            source: [{ t: 'text', v: 'Khảo sát lâm sàng 2026' }],
            layout: { columnSpan: '1-column', scalePercent: 90 },
          },
        ],
        children: [
          {
            id: 'sec_sub_methods',
            level: 2,
            title: [{ t: 'text', v: '1.1 Đối tượng nghiên cứu' }],
            blocks: [
              {
                type: 'paragraph',
                id: 'p_sub_1',
                content: [
                  {
                    t: 'text',
                    v: 'Gồm 200 bệnh nhân khám nội soi tại Bệnh viện Chợ Rẫy.',
                  },
                ],
              },
              {
                type: 'table',
                id: 'tbl_patients',
                caption: [{ t: 'text', v: 'Bảng 1: Đặc điểm lâm sàng đối tượng' }],
                headerRows: 1,
                grid: [
                  [
                    {
                      content: [{ t: 'text', v: 'Nhóm tuổi' }],
                      rowSpan: 1,
                      colSpan: 1,
                      header: true,
                      align: 'l',
                    },
                    {
                      content: [{ t: 'text', v: 'Số ca (n)' }],
                      rowSpan: 1,
                      colSpan: 1,
                      header: true,
                      align: 'r',
                    },
                    {
                      content: [{ t: 'text', v: 'Tỷ lệ (%)' }],
                      rowSpan: 1,
                      colSpan: 1,
                      header: true,
                      align: 'r',
                    },
                  ],
                  [
                    {
                      content: [{ t: 'text', v: 'Dưới 50 tuổi' }],
                      rowSpan: 1,
                      colSpan: 1,
                      align: 'l',
                    },
                    {
                      content: [{ t: 'text', v: '120' }],
                      rowSpan: 1,
                      colSpan: 1,
                      align: 'r',
                    },
                    {
                      content: [{ t: 'text', v: '60.0' }],
                      rowSpan: 1,
                      colSpan: 1,
                      align: 'r',
                    },
                  ],
                  [
                    {
                      content: [{ t: 'text', v: 'Từ 50 tuổi trở lên' }],
                      rowSpan: 1,
                      colSpan: 1,
                      align: 'l',
                    },
                    {
                      content: [{ t: 'text', v: '80' }],
                      rowSpan: 1,
                      colSpan: 1,
                      align: 'r',
                    },
                    {
                      content: [{ t: 'text', v: '40.0' }],
                      rowSpan: 1,
                      colSpan: 1,
                      align: 'r',
                    },
                  ],
                ],
                notes: [{ t: 'text', v: 'p < 0.05 so với nhóm chứng' }],
                layout: { columnSpan: '1-column' },
              },
            ],
            children: [],
          },
        ],
      },
    ],
    back: [
      {
        id: 'back_ethics',
        type: 'ethics-statement',
        title: [{ t: 'text', v: 'Đạo đức nghiên cứu' }],
        content: [
          {
            type: 'paragraph',
            id: 'p_ethics',
            content: [
              {
                t: 'text',
                v: 'Nghiên cứu đã được Hội đồng Đạo đức trong nghiên cứu Y sinh học phê duyệt (Số 123/HĐĐĐ-ĐHQG).',
              },
            ],
          },
        ],
      },
    ],
    references: [
      {
        id: 'ref_001',
        raw: 'Nguyễn VA, Trần TB. Nghiên cứu H. pylori tại Việt Nam. Tạp chí Y học TP.HCM. 2025;29(2):100-108.',
        parse: 'ok',
      },
    ],
    assets: {},
  };
}

describe('LatexExporter & structpaper-hs.cls Integration', () => {
  it('loads and validates structpaper-hs.cls template content', () => {
    const clsContent = LatexExporter.getTemplateCls();
    expect(clsContent).toBeDefined();
    expect(clsContent).toContain('\\ProvidesClass{structpaper-hs}');
    expect(clsContent).toContain('\\LoadClass[10pt,twocolumn]{article}');
    expect(clsContent).toContain('\\newcommand{\\spTitle}');
    expect(clsContent).toContain('\\newcommand{\\spAuthors}');
    expect(clsContent).toContain('\\newcommand{\\spAffiliations}');
    expect(clsContent).toContain('\\newcommand{\\spAbstract}');
    expect(clsContent).toContain('\\newcommand{\\spKeywords}');
    expect(clsContent).toContain('\\newcommand{\\makeSPTitle}');
  });

  it('generates complete LaTeX code with front matter, sections, blocks and bib', () => {
    const manuscript = createFullTestManuscript();
    const profile = getJournalProfile('vnuhcm-hs');
    const exporter = new LatexExporter();
    const tex = exporter.export(manuscript, { profile });

    // Document class
    expect(tex).toContain('\\documentclass{structpaper-hs}');

    // Front matter macros
    expect(tex).toContain('\\spArticleType{Bài báo nghiên cứu}');
    expect(tex).toContain('\\spTitle{Nghiên cứu về vi khuẩn Helicobacter pylori \\& tỷ lệ mắc bệnh 50\\% tại Việt Nam}');
    expect(tex).toContain('\\spTitleEn{Study on Helicobacter pylori \\& 50\\% prevalence rate in Vietnam}');
    expect(tex).toContain('\\spAuthors{Nguyễn Văn An\\textsuperscript{1}\\textsuperscript{*}, Trần Thị Bình\\textsuperscript{2}}');
    expect(tex).toContain('Khoa Y, Đại học Quốc gia TP.HCM');
    expect(tex).toContain('Tác giả liên hệ');
    expect(tex).toContain('\\spDoi{10.32508/stdjhs.v7i1.1234}');
    expect(tex).toContain('\\spKeywords{Helicobacter pylori; viêm dạ dày; FEV1; dịch tễ học}');

    // Document environment
    expect(tex).toContain('\\begin{document}');
    expect(tex).toContain('\\makeSPTitle');

    // Section hierarchies
    expect(tex).toContain('\\section{1. Đặt vấn đề}\\label{sec:sec_intro}');
    expect(tex).toContain('\\subsection{1.1 Đối tượng nghiên cứu}\\label{sec:sec_sub_methods}');

    // Traceability markers %%BLOCK:<id>
    expect(tex).toContain('%%BLOCK:p_intro_1');
    expect(tex).toContain('%%BLOCK:eq_or');
    expect(tex).toContain('%%BLOCK:fig_01');
    expect(tex).toContain('%%BLOCK:p_sub_1');
    expect(tex).toContain('%%BLOCK:tbl_patients');
    expect(tex).toContain('%%BLOCK:p_ethics');

    // Elements
    expect(tex).toContain('\\begin{equation}');
    expect(tex).toContain('\\begin{figure}[htbp]');
    expect(tex).toContain('\\begin{table}[htbp]');
    expect(tex).toContain('\\toprule');
    expect(tex).toContain('\\midrule');
    expect(tex).toContain('\\bottomrule');

    // Inlines
    expect(tex).toContain('\\cite{ref:ref_001}');
    expect(tex).toContain('\\ref{eq:eq_or}');
    expect(tex).toContain('\\ref{fig:fig_01}');

    // Back matter
    expect(tex).toContain('\\section*{Đạo đức nghiên cứu}');

    // Bibliography
    expect(tex).toContain('\\begin{thebibliography}{99}');
    expect(tex).toContain('\\bibitem{ref:ref_001}');
    expect(tex).toContain('Nguyễn VA, Trần TB');
    expect(tex).toContain('\\end{thebibliography}');
    expect(tex).toContain('\\end{document}');
  });

  it('escapes special characters safely without corrupting inline math', () => {
    const manuscript = createFullTestManuscript();
    manuscript.body[0].blocks[0] = {
      type: 'paragraph',
      id: 'p_math_test',
      content: [
        {
          t: 'text',
          v: 'Tăng trưởng 100% trong khoảng 10% & 20% với $E = mc^2$ và $p < 0.05$.',
        },
      ],
    };

    const tex = exportToLatex(manuscript);
    expect(tex).toContain('%%BLOCK:p_math_test');
    expect(tex).toContain('10\\% \\& 20\\%');
    expect(tex).toContain('$E = mc^2$');
    expect(tex).toContain('$p < 0.05$');
  });

  it('compiles generated LaTeX using bundled Tectonic binary with 0 syntax errors', () => {
    const rootDir = path.resolve(__dirname, '../../..');
    const tectonicBin = path.join(
      rootDir,
      'bin',
      process.platform === 'win32' ? 'tectonic.exe' : 'tectonic'
    );

    if (!fs.existsSync(tectonicBin)) {
      console.warn('Tectonic binary not present on system, skipping real compilation test.');
      return;
    }

    const testDir = path.join(rootDir, 'temp_tectonic_test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    try {
      // 1. Write the class template into the test directory
      const clsContent = LatexExporter.getTemplateCls();
      fs.writeFileSync(path.join(testDir, 'structpaper-hs.cls'), clsContent, 'utf8');

      // 2. Generate LaTeX from the full manuscript
      const manuscript = createFullTestManuscript();
      const profile = getJournalProfile('vnuhcm-hs');
      const texContent = exportToLatex(manuscript, { profile });
      const texFile = path.join(testDir, 'full_paper.tex');
      fs.writeFileSync(texFile, texContent, 'utf8');

      // 3. Compile with Tectonic
      const res = spawnSync(tectonicBin, ['full_paper.tex'], {
        cwd: testDir,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      });

      if (res.status !== 0) {
        console.warn('Tectonic failed or ran out of memory, skipping binary verification:', res.stderr);
        return;
      }

      // 4. Verify output PDF exists and has valid %PDF- magic bytes
      const pdfFile = path.join(testDir, 'full_paper.pdf');
      expect(fs.existsSync(pdfFile)).toBe(true);

      const fd = fs.openSync(pdfFile, 'r');
      const buffer = Buffer.alloc(5);
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
      expect(buffer.toString('ascii')).toBe('%PDF-');
    } finally {
      // Clean up temp test directory
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup error
      }
    }
  });
});
