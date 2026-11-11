/**
 * Figures laid out in a Word table: a grid of pictures with "a)", "b)", "c)" labels and the caption
 * "Hình N. …" in one of the cells (common for multi-panel figures, e.g. EES ID850 Figures 3–5).
 * Such a table is a figure, not a data table: the importer turns it into one figure whose image is
 * the panels composed on their grid (browser only; elsewhere the nearest single panel is kept).
 */

const CAPTION_RE = /^\s*(?:h\s*ình|hình|figure|fig\.?)\s*(\d+)\s*[:.]/i;
const LABEL_RE = /^\(?([a-z])\)$/i;
const IMG_RE = /<a:blip\b[^>]*\br:embed="([^"]+)"|<v:imagedata\b[^>]*\br:id="([^"]+)"/gi;

export interface FigurePanel {
  /** relationship id of the picture */
  rId: string;
  row: number;
  col: number;
  label: string;
}

export interface FigureTable {
  num: number;
  caption: string;
  rows: number;
  cols: number;
  panels: FigurePanel[];
}

const cellText = (xml: string): string =>
  (xml.match(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/gi) || [])
    .map((t) => t.replace(/<[^>]+>/g, ''))
    .join('')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

/** Null unless the table holds at least one picture and a "Hình N" caption inside it. */
export function figureTableInfo(tblXml: string): FigureTable | null {
  if (!/<a:blip\b|<v:imagedata\b/i.test(tblXml)) return null;
  const grid: { text: string; rIds: string[]; row: number; col: number }[] = [];
  const rowsXml = tblXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/gi) || [];
  let cols = 0;
  rowsXml.forEach((trXml, row) => {
    let col = 0;
    for (const tc of trXml.match(/<w:tc\b[\s\S]*?<\/w:tc>/gi) || []) {
      const span = Number(tc.match(/<w:gridSpan\b[^>]*w:val="(\d+)"/i)?.[1] || 1);
      const rIds = [...tc.matchAll(IMG_RE)].map((m) => m[1] || m[2]);
      grid.push({ text: cellText(tc), rIds, row, col });
      col += span;
    }
    cols = Math.max(cols, col);
  });
  const capCell = grid.find((c) => CAPTION_RE.test(c.text));
  if (!capCell) return null;
  const num = Number(capCell.text.match(CAPTION_RE)![1]);

  const panels: FigurePanel[] = [];
  for (const cell of grid) {
    for (const rId of cell.rIds) {
      const below = grid.find((c) => c.row === cell.row + 1 && c.col === cell.col && LABEL_RE.test(c.text));
      const own = LABEL_RE.test(cell.text) ? cell.text : '';
      const letter = (below?.text || own).match(LABEL_RE)?.[1];
      panels.push({ rId, row: cell.row, col: cell.col, label: `${(letter || String.fromCharCode(97 + panels.length)).toLowerCase()})` });
    }
  }
  if (panels.length === 0) return null;
  return { num, caption: capCell.text, rows: rowsXml.length, cols, panels };
}

/** The caption paragraph that replaces a figure table in the text pass (so the figure is created in place). */
export function figureTableAsCaptionParagraph(tblXml: string): string | null {
  const info = figureTableInfo(tblXml);
  if (!info) return null;
  const esc = info.caption.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<w:p><w:r><w:t xml:space="preserve">${esc}</w:t></w:r></w:p>`;
}

/**
 * Draw the panels on their grid with the label centred under each one. Browser only (needs canvas);
 * returns null elsewhere or on any failure so the caller keeps its single-panel fallback.
 */
export async function composeFigurePanels(
  panels: { dataUrl: string; row: number; col: number; label: string }[],
  panelWidth = 900
): Promise<string | null> {
  if (typeof document === 'undefined' || panels.length < 2) return null;
  try {
    const imgs = await Promise.all(
      panels.map(
        (p) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = p.dataUrl;
          })
      )
    );
    // Rows/columns that hold pictures, in order (label-only rows collapse).
    const rowsUsed = [...new Set(panels.map((p) => p.row))].sort((a, b) => a - b);
    const colsUsed = [...new Set(panels.map((p) => p.col))].sort((a, b) => a - b);
    const gap = Math.round(panelWidth * 0.04);
    const labelH = Math.round(panelWidth * 0.08);
    const heights = rowsUsed.map((r) =>
      Math.max(...panels.map((p, i) => (p.row === r ? (imgs[i].naturalHeight / imgs[i].naturalWidth) * panelWidth : 0)))
    );
    const width = colsUsed.length * panelWidth + (colsUsed.length - 1) * gap;
    const height = heights.reduce((a, h) => a + h + labelH, 0) + (rowsUsed.length - 1) * gap;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(labelH * 0.6)}px "Times New Roman", serif`;
    panels.forEach((p, i) => {
      const ri = rowsUsed.indexOf(p.row);
      const ci = colsUsed.indexOf(p.col);
      const x = ci * (panelWidth + gap);
      const y = heights.slice(0, ri).reduce((a, h) => a + h + labelH + gap, 0);
      const h = (imgs[i].naturalHeight / imgs[i].naturalWidth) * panelWidth;
      ctx.drawImage(imgs[i], x, y, panelWidth, h);
      ctx.fillText(p.label, x + panelWidth / 2, y + heights[ri] + labelH / 2);
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
