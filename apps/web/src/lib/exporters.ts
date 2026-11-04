import JSZip from 'jszip';
import { CompletePaper } from './sample-papers';
import { generateFullJournalLatex, generateLatexPackageZip } from './latex-template';

export { generateLatexPackageZip };

export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { LayoutSettings } from '@/types/paper';

export function exportToLatex(paper: CompletePaper, customSettings?: LayoutSettings): string {
  return generateFullJournalLatex(paper, customSettings);
}

export function exportToJson(paper: CompletePaper): string {
  return JSON.stringify(paper, null, 2);
}

export function exportToHtml(paper: CompletePaper): string {
  const { metadata, sections, references } = paper;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metadata.title}</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; max-width: 850px; margin: 40px auto; line-height: 1.6; color: #111; padding: 0 20px; }
    h1 { color: #2B74B7; font-size: 22px; text-transform: uppercase; margin-bottom: 8px; }
    .title-en { font-style: italic; color: #4B5563; font-size: 16px; margin-bottom: 16px; }
    h2 { color: #2B74B7; font-size: 16px; border-bottom: 1px solid #2B74B7; padding-bottom: 4px; margin-top: 24px; text-transform: uppercase; }
    h3 { font-size: 14px; font-weight: bold; margin-top: 16px; }
    .authors { font-weight: bold; margin-bottom: 8px; }
    .affiliations { font-size: 13px; font-style: italic; color: #4B5563; margin-bottom: 8px; }
    .corresponding { font-size: 13px; color: #374151; margin-bottom: 16px; }
    .abstract-box { background-color: #E7ECF7; border: 1px solid #CBD8EF; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
    .figure-box { background-color: #F8FAFC; padding: 12px; border: 1px solid #E2E8F0; border-radius: 6px; text-align: center; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th { background-color: #E5E5E5; border: 1px solid #ccc; padding: 8px; text-align: left; }
    td { border: 1px solid #ccc; padding: 8px; }
    tr:nth-child(even) { background-color: #E7ECF7; }
    .ref-item { margin-bottom: 8px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>${metadata.title}</h1>
  ${metadata.titleEn ? `<div class="title-en">${metadata.titleEn}</div>` : ''}
  <div class="authors">${metadata.authors.map((a) => `${a.name}${a.isCorresponding ? '*' : ''} (${a.affiliationIds.join(',')})`).join(', ')}</div>
  <div class="affiliations">${metadata.affiliations.map((a) => `${a.id}. ${a.name}`).join('<br>')}</div>
  ${metadata.corresponding?.email ? `<div class="corresponding">Tác giả liên hệ: ${metadata.corresponding.name} - Email: ${metadata.corresponding.email}</div>` : ''}
  
  <div class="abstract-box">
    <strong>TÓM TẮT:</strong> ${metadata.abstract}
    <br><br>
    <strong>Từ khoá:</strong> ${metadata.keywords.join(', ')}
  </div>

  <div class="content">
    ${sections
      .map((sec) => {
        if (sec.type === 'h1') return `<h2>${sec.title}</h2>`;
        if (sec.type === 'h2') return `<h3>${sec.title}</h3>`;
        if (sec.type === 'paragraph') return `<p>${sec.content}</p>`;
        if (sec.type === 'figure' && sec.figure) {
          return `<div class="figure-box">
            ${sec.figure.src ? `<img src="${sec.figure.src}" style="max-width:100%; height:auto;" alt="${sec.figure.caption}" />` : ''}
            <p><strong>Hình ${sec.figure.num}:</strong> ${sec.figure.caption}</p>
          </div>`;
        }
        if (sec.type === 'table' && sec.table) {
          return `<div>
            <p><strong>Bảng ${sec.table.num}:</strong> ${sec.table.caption}</p>
            <table>
              <thead><tr>${sec.table.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${sec.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>`;
        }
        return '';
      })
      .join('\n')}
  </div>

  ${
    references.length > 0
      ? `<h2>TÀI LIỆU THAM KHẢO</h2>
    <div>${references.map((ref) => `<p class="ref-item"><strong>[${ref.id}]</strong> ${ref.raw}</p>`).join('')}</div>`
      : ''
  }
</body>
</html>`;
}

export function exportToJatsXml(paper: CompletePaper): string {
  const { metadata, sections, references } = paper;

  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // Group sections by h1
  let bodyXml = '';
  let inSec = false;

  for (const s of sections) {
    if (s.type === 'h1') {
      if (inSec) bodyXml += '    </sec>\n';
      bodyXml += `    <sec>\n      <title>${escapeXml(s.title || '')}</title>\n`;
      inSec = true;
    } else if (s.type === 'h2') {
      bodyXml += `      <sec>\n        <title>${escapeXml(s.title || '')}</title>\n      </sec>\n`;
    } else if (s.type === 'paragraph') {
      bodyXml += `      <p>${escapeXml(s.content)}</p>\n`;
    } else if (s.type === 'figure' && s.figure) {
      bodyXml += `      <fig id="fig-${s.figure.num}">\n        <label>Hình ${s.figure.num}</label>\n        <caption><p>${escapeXml(s.figure.caption)}</p></caption>\n      </fig>\n`;
    } else if (s.type === 'table' && s.table) {
      bodyXml += `      <table-wrap id="tbl-${s.table.num}">\n        <label>Bảng ${s.table.num}</label>\n        <caption><p>${escapeXml(s.table.caption)}</p></caption>\n        <table>\n          <thead><tr>${s.table.headers.map((h) => `<th>${escapeXml(h)}</th>`).join('')}</tr></thead>\n          <tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeXml(c)}</td>`).join('')}</tr>`).join('')}</tbody>\n        </table>\n      </table-wrap>\n`;
    }
  }
  if (inSec) bodyXml += '    </sec>\n';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.2 20190208//EN" "JATS-archivearticle1.dtd">
<article xmlns:xlink="http://www.w3.org/1999/xlink" article-type="${escapeXml(metadata.articleType)}">
  <front>
    <journal-meta>
      <journal-id journal-id-type="publisher-id">${escapeXml(metadata.journalId)}</journal-id>
      <journal-title-group>
        <journal-title>${escapeXml(metadata.journalName)}</journal-title>
      </journal-title-group>
      <issn pub-type="epub">2615-9783</issn>
      <publisher><publisher-name>ĐHQG TP.HCM</publisher-name></publisher>
    </journal-meta>
    <article-meta>
      <article-id pub-id-type="doi">${escapeXml(metadata.doi.replace('https://doi.org/', ''))}</article-id>
      <title-group>
        <article-title>${escapeXml(metadata.title)}</article-title>
        ${metadata.titleEn ? `<trans-title-group xml:lang="en"><trans-title>${escapeXml(metadata.titleEn)}</trans-title></trans-title-group>` : ''}
      </title-group>
      <contrib-group>
        ${metadata.authors
          .map(
            (a) => `<contrib contrib-type="author" ${a.isCorresponding ? 'corresp="yes"' : ''}>
          <name><surname>${escapeXml(a.name.split(' ').pop() || '')}</surname><given-names>${escapeXml(a.name.split(' ').slice(0, -1).join(' '))}</given-names></name>
          ${a.email ? `<email>${escapeXml(a.email)}</email>` : ''}
        </contrib>`
          )
          .join('\n        ')}
      </contrib-group>
      <abstract><p>${escapeXml(metadata.abstract)}</p></abstract>
      <kwd-group kwd-group-type="author">
        ${metadata.keywords.map((k) => `<kwd>${escapeXml(k)}</kwd>`).join('\n        ')}
      </kwd-group>
    </article-meta>
  </front>
  <body>
${bodyXml}  </body>
  <back>
    <ref-list>
      <title>TÀI LIỆU THAM KHẢO</title>
      ${references.map((r) => `<ref id="R${r.id}"><mixed-citation publication-type="journal">${escapeXml(r.raw)}</mixed-citation></ref>`).join('\n      ')}
    </ref-list>
  </back>
</article>`;
}

export async function generatePaperZip(paper: CompletePaper): Promise<Blob> {
  const zip = new JSZip();
  const folderName = paper.id || 'paper_package';
  const folder = zip.folder(folderName) || zip;

  folder.file('paper.tex', exportToLatex(paper));
  folder.file('paper.html', exportToHtml(paper));
  folder.file('paper.xml', exportToJatsXml(paper));
  folder.file('paper.json', exportToJson(paper));

  // Include extracted figures if any
  const imgFolder = folder.folder('images');
  paper.sections.forEach((sec) => {
    if (sec.type === 'figure' && sec.figure && sec.figure.src) {
      if (sec.figure.src.startsWith('data:image')) {
        const parts = sec.figure.src.split(',');
        if (parts[1]) {
          imgFolder?.file(`fig${sec.figure.num}.png`, parts[1], { base64: true });
        }
      }
    }
  });

  return await zip.generateAsync({ type: 'blob' });
}
