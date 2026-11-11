import type JSZip from 'jszip';
import { pairFiguresWithImages, pairShapeDrawings, parseImageRelationships } from './docx-figures';
import { figureTableInfo, composeFigurePanels } from './docx-figure-tables';
import { drawingToSvg, svgToPngDataUrl } from './drawingml';

export interface FigureImages {
  /** media file name -> data URL (EMF/WMF skipped). */
  imageMap: Map<string, string>;
  /** figure number -> data URL of its picture (or redrawn shape drawing). */
  figureImageMap: Map<number, string>;
  /** Figure numbers whose caption paragraph exists in the XML (position pairing is authoritative for them). */
  xmlCaptionNumbers: Set<number>;
}

/** Collect the pictures of a .docx and pair each with its figure caption (see docx-figures.ts). */
export async function loadFigureImages(zip: JSZip, html: string | undefined): Promise<FigureImages> {
  const imageMap = new Map<string, string>();
  const mediaFiles = Object.keys(zip.files).filter(
    (path) => path.startsWith('word/media/') && !zip.files[path].dir
  );

  for (const mediaPath of mediaFiles) {
    const file = zip.file(mediaPath);
    if (file) {
      const ext = mediaPath.split('.').pop()?.toLowerCase() || 'png';
      if (['emf', 'wmf'].includes(ext)) continue;
      const base64 = await file.async('base64');
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mime};base64,${base64}`;
      const name = mediaPath.replace('word/media/', '');
      imageMap.set(name, dataUrl);
    }
  }

  const figureImageMap = new Map<number, string>();
  if (html) {
    const chunkRegex = /(<img[^>]+>|<p[^>]*>[\s\S]*?<\/p>|<h1[^>]*>[\s\S]*?<\/h1>|<h2[^>]*>[\s\S]*?<\/h2>)/gi;
    let match: RegExpExecArray | null;
    let pendingImg: string | null = null;
    while ((match = chunkRegex.exec(html)) !== null) {
      const chunk = match[0];
      if (chunk.startsWith('<img')) {
        const srcMatch = chunk.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
          pendingImg = srcMatch[1];
        }
      } else {
        const text = chunk.replace(/<[^>]+>/g, '').trim();
        const figMatch = text.match(/^(?:h\s*ình|hình|figure|fig\.|h\.)\s*(\d*)[:.]/i);
        if (figMatch) {
          const figNum = figMatch[1] ? parseInt(figMatch[1], 10) : figureImageMap.size + 1;
          if (pendingImg) {
            figureImageMap.set(figNum, pendingImg);
            pendingImg = null;
          }
        }
      }
    }
  }

  // Position-based pairing (caption <-> nearest picture) is authoritative for every figure whose caption
  // paragraph exists in the XML: it handles captions above the picture and figures that are native
  // drawings (no picture at all). Figures it cannot see keep the order-based pairing.
  const xmlCaptionNumbers = new Set<number>();
  try {
    const docXmlForFigures = await zip.file('word/document.xml')?.async('text');
    const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('text');
    if (docXmlForFigures && relsXml) {
      const pairing = pairFiguresWithImages(docXmlForFigures, relsXml);
      pairing.captionNumbers.forEach((n) => {
        xmlCaptionNumbers.add(n);
        figureImageMap.delete(n);
      });
      pairing.images.forEach((name, num) => {
        const dataUrl = imageMap.get(name);
        if (dataUrl) figureImageMap.set(num, dataUrl);
      });
      // Multi-panel figures laid out in a table (a/b/c pictures + caption cell): compose one image.
      const rels = parseImageRelationships(relsXml);
      for (const tbl of docXmlForFigures.match(/<w:tbl[\s>][\s\S]*?<\/w:tbl>/gi) || []) {
        const info = figureTableInfo(tbl);
        if (!info || info.panels.length < 2) continue;
        const panels = info.panels
          .map((p) => ({ ...p, dataUrl: imageMap.get(rels.get(p.rId) || '') || '' }))
          .filter((p) => p.dataUrl);
        const composed = await composeFigurePanels(panels);
        if (composed) figureImageMap.set(info.num, composed);
      }
      // Figures made of Word shapes (no picture file): redraw them as SVG, then PNG (browser only).
      const themeXml = await zip.file('word/theme/theme1.xml')?.async('text');
      const taken = new Set<number>(figureImageMap.keys());
      for (const [num, drawingXml] of pairShapeDrawings(docXmlForFigures, taken)) {
        const svg = drawingToSvg(drawingXml, themeXml);
        const png = svg ? await svgToPngDataUrl(svg.svg) : null;
        if (png) figureImageMap.set(num, png);
      }
    }
  } catch {
    /* keep the order-based pairing */
  }

  if (figureImageMap.size === 0 && xmlCaptionNumbers.size === 0 && imageMap.size > 0) {
    let figIdx = 1;
    imageMap.forEach((dataUrl) => {
      figureImageMap.set(figIdx, dataUrl);
      figIdx++;
    });
  }

  return { imageMap, figureImageMap, xmlCaptionNumbers };
}
