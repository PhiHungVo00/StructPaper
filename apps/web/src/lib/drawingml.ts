import { XMLParser } from 'fast-xml-parser';

/**
 * Draws a Word "drawing" made of shapes (ovals, boxes, lines/arrows, text boxes, nested groups) as SVG.
 * Many research diagrams (conceptual models) are built this way and contain no picture file, so the
 * importer would otherwise report an empty figure. Supports the shapes those diagrams use; unknown
 * shapes are skipped rather than guessed.
 */

type Node = Record<string, any>;

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: false,
  parseTagValue: false,
});

/** Office default palette, used when the file's own theme is not supplied. */
export const DEFAULT_SCHEME_COLORS: Record<string, string> = {
  dk1: '000000', lt1: 'FFFFFF', dk2: '44546A', lt2: 'E7E6E6',
  accent1: '4472C4', accent2: 'ED7D31', accent3: 'A5A5A5', accent4: 'FFC000', accent5: '5B9BD5', accent6: '70AD47',
  hlink: '0563C1', folHlink: '954F72', tx1: '000000', bg1: 'FFFFFF', tx2: '44546A', bg2: 'E7E6E6',
};

/** Read `<a:clrScheme>` from word/theme/theme1.xml. */
export function parseThemeColors(themeXml: string | undefined): Record<string, string> {
  const colors = { ...DEFAULT_SCHEME_COLORS };
  if (!themeXml) return colors;
  const scheme = themeXml.match(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/)?.[0] || '';
  for (const m of scheme.matchAll(/<a:(dk1|lt1|dk2|lt2|accent[1-6]|hlink|folHlink)>\s*<a:(?:srgbClr val|sysClr val="[^"]*" lastClr)="([0-9A-Fa-f]{6})"/g)) {
    colors[m[1]] = m[2];
  }
  colors.tx1 = colors.dk1;
  colors.bg1 = colors.lt1;
  colors.tx2 = colors.dk2;
  colors.bg2 = colors.lt2;
  return colors;
}

const tagOf = (n: Node): string | undefined => Object.keys(n).find((k) => k !== ':@');
const kids = (n: Node): Node[] => {
  const t = tagOf(n);
  const c = t ? n[t] : undefined;
  return Array.isArray(c) ? c : [];
};
const attrs = (n: Node): Record<string, string> => {
  const raw = n[':@'] || {};
  const out: Record<string, string> = {};
  for (const k of Object.keys(raw)) out[k.replace(/^@_/, '')] = raw[k];
  return out;
};
const find = (nodes: Node[], tag: string): Node | undefined => nodes.find((n) => tagOf(n) === tag);
const findAll = (nodes: Node[], tag: string): Node[] => nodes.filter((n) => tagOf(n) === tag);
const num = (v: string | undefined, d = 0) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Affine {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
}
/** Output unit is the point (1/12700 EMU): keeps font sizes and stroke widths in normal ranges for SVG renderers. */
const EMU_PER_PT = 12700;
const IDENTITY: Affine = { sx: 1 / EMU_PER_PT, sy: 1 / EMU_PER_PT, tx: 0, ty: 0 };
const apply = (t: Affine, x: number, y: number) => ({ x: t.sx * x + t.tx, y: t.sy * y + t.ty });
const compose = (outer: Affine, inner: Affine): Affine => ({
  sx: outer.sx * inner.sx,
  sy: outer.sy * inner.sy,
  tx: outer.sx * inner.tx + outer.tx,
  ty: outer.sy * inner.ty + outer.ty,
});

interface Ctx {
  colors: Record<string, string>;
  defs: Set<string>;
  out: string[];
}

function colorOf(holder: Node[] | undefined, ctx: Ctx): string | undefined {
  if (!holder) return undefined;
  const solid = find(holder, 'a:solidFill');
  if (!solid) return undefined;
  const c = kids(solid)[0];
  if (!c) return undefined;
  const t = tagOf(c);
  if (t === 'a:srgbClr') return `#${attrs(c).val}`;
  if (t === 'a:sysClr') return `#${attrs(c).lastClr || '000000'}`;
  if (t === 'a:schemeClr') return `#${ctx.colors[attrs(c).val] || '000000'}`;
  return undefined;
}

function styleColor(style: Node | undefined, ref: string, ctx: Ctx): string | undefined {
  const r = style && find(kids(style), ref);
  const c = r && kids(r)[0];
  if (!c) return undefined;
  const t = tagOf(c);
  if (t === 'a:schemeClr') return `#${ctx.colors[attrs(c).val] || '000000'}`;
  if (t === 'a:srgbClr') return `#${attrs(c).val}`;
  return undefined;
}

function arrowMarker(ctx: Ctx, color: string): string {
  const id = `arrow-${color.slice(1)}`;
  if (!ctx.defs.has(id)) {
    ctx.defs.add(id);
    ctx.out.unshift(
      `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker></defs>`
    );
  }
  return id;
}

/** Text of a text box: one string per paragraph, with the largest font size (EMU) and boldness. */
function textBox(wsp: Node[]): { lines: string[]; sizeEmu: number; bold: boolean } | null {
  const txbx = find(wsp, 'wps:txbx');
  const content = txbx && find(kids(txbx), 'w:txbxContent');
  if (!content) return null;
  const lines: string[] = [];
  let size = 0;
  let bold = false;
  const collect = (nodes: Node[]) => {
    for (const n of nodes) {
      const t = tagOf(n);
      if (t === 'w:p') {
        let line = '';
        const walk = (ns: Node[]) => {
          for (const x of ns) {
            const xt = tagOf(x);
            if (xt === 'w:t') line += kids(x).map((k) => (typeof k['#text'] === 'string' ? k['#text'] : '')).join('');
            else if (xt === 'w:sz') size = Math.max(size, num(attrs(x).val) / 2);
            else if (xt === 'w:b') bold = bold || attrs(x).val !== '0';
            else if (xt === 'w:tab') line += ' ';
            if (xt && xt !== 'w:t') walk(kids(x));
          }
        };
        walk(kids(n));
        if (line.trim()) lines.push(line);
      } else if (t) {
        collect(kids(n));
      }
    }
  };
  collect(kids(content));
  return lines.length ? { lines, sizeEmu: (size || 10) * 12700, bold } : null;
}

function renderShape(wsp: Node, t: Affine, ctx: Ctx): void {
  const parts = kids(wsp);
  const spPr = find(parts, 'wps:spPr');
  if (!spPr) return;
  const sp = kids(spPr);
  const xfrm = find(sp, 'a:xfrm');
  if (!xfrm) return;
  const xa = attrs(xfrm);
  const off = attrs(find(kids(xfrm), 'a:off') || {});
  const ext = attrs(find(kids(xfrm), 'a:ext') || {});
  const x0 = num(off.x);
  const y0 = num(off.y);
  const cx = num(ext.cx);
  const cy = num(ext.cy);
  const geom = attrs(find(sp, 'a:prstGeom') || {}).prst || 'rect';
  const style = find(parts, 'wps:style');

  const flipH = xa.flipH === '1' || xa.flipH === 'true';
  const flipV = xa.flipV === '1' || xa.flipV === 'true';
  const rot = num(xa.rot) / 60000;

  // child space -> output space (scale only; rotation is applied around the shape centre)
  const p1 = apply(t, x0, y0);
  const p2 = apply(t, x0 + cx, y0 + cy);
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const w = Math.abs(p2.x - p1.x);
  const h = Math.abs(p2.y - p1.y);
  const mx = x + w / 2;
  const my = y + h / 2;

  const ln = find(sp, 'a:ln');
  const lnKids = ln ? kids(ln) : [];
  const noLine = !!find(lnKids, 'a:noFill');
  let stroke = colorOf(lnKids, ctx) || styleColor(style, 'a:lnRef', ctx) || '#000000';
  if (geom === 'textNoShape') stroke = 'none';
  const lnWidth = num(attrs(ln || {}).w, 9525) * Math.abs(t.sx);
  const dash = attrs(find(lnKids, 'a:prstDash') || {}).val;

  const hasNoFill = !!find(sp, 'a:noFill');
  let fill = colorOf(sp, ctx);
  if (!fill && !hasNoFill && geom !== 'line' && !/Connector/.test(geom) && geom !== 'textNoShape') {
    fill = styleColor(style, 'a:fillRef', ctx);
  }

  const common = `${noLine || stroke === 'none' ? 'stroke="none"' : `stroke="${stroke}" stroke-width="${lnWidth}"`}${dash && dash !== 'solid' ? ` stroke-dasharray="${lnWidth * 4},${lnWidth * 3}"` : ''}`;
  const rotate = rot ? ` transform="rotate(${rot} ${mx} ${my})"` : '';
  let el = '';
  if (geom === 'ellipse') {
    el = `<ellipse cx="${mx}" cy="${my}" rx="${w / 2}" ry="${h / 2}" fill="${fill || 'none'}" ${common}${rotate}/>`;
  } else if (geom === 'rect' || geom === 'roundRect' || geom === 'flowChartProcess') {
    const r = geom === 'roundRect' ? Math.min(w, h) * 0.16 : 0;
    el = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill || 'none'}" ${common}${rotate}/>`;
  } else if (geom === 'line' || /Connector/.test(geom)) {
    const sx = flipH ? x + w : x;
    const ex = flipH ? x : x + w;
    const sy = flipV ? y + h : y;
    const ey = flipV ? y : y + h;
    const tail = attrs(find(lnKids, 'a:tailEnd') || {}).type;
    const head = attrs(find(lnKids, 'a:headEnd') || {}).type;
    const markers =
      (tail && tail !== 'none' ? ` marker-end="url(#${arrowMarker(ctx, stroke === 'none' ? '#000000' : stroke)})"` : '') +
      (head && head !== 'none' ? ` marker-start="url(#${arrowMarker(ctx, stroke === 'none' ? '#000000' : stroke)})"` : '');
    el = `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" ${common}${markers}${rotate}/>`;
  } else if (geom === 'textNoShape') {
    el = '';
  } else {
    return; // unsupported preset geometry: skip
  }
  if (el) ctx.out.push(el);

  const text = textBox(parts);
  if (text) {
    const fs = text.sizeEmu * Math.abs(t.sy);
    const lineH = fs * 1.2;
    const startY = my - ((text.lines.length - 1) * lineH) / 2;
    text.lines.forEach((line, i) => {
      ctx.out.push(
        `<text x="${mx}" y="${startY + i * lineH}" font-family="'Times New Roman', Times, serif" font-size="${fs}" ${text.bold ? 'font-weight="bold" ' : ''}text-anchor="middle" dominant-baseline="central" fill="#000000"${rotate}>${esc(line)}</text>`
      );
    });
  }
}

function walk(node: Node, t: Affine, ctx: Ctx): void {
  const tag = tagOf(node);
  if (tag === 'wps:wsp') return renderShape(node, t, ctx);
  if (tag === 'wpg:wgp' || tag === 'wpg:grpSp') {
    const parts = kids(node);
    const grpSpPr = find(parts, 'wpg:grpSpPr');
    const xfrm = grpSpPr && find(kids(grpSpPr), 'a:xfrm');
    let local = IDENTITY;
    if (xfrm) {
      const off = attrs(find(kids(xfrm), 'a:off') || {});
      const ext = attrs(find(kids(xfrm), 'a:ext') || {});
      const chOff = attrs(find(kids(xfrm), 'a:chOff') || {});
      const chExt = attrs(find(kids(xfrm), 'a:chExt') || {});
      const sx = num(chExt.cx) ? num(ext.cx) / num(chExt.cx) : 1;
      const sy = num(chExt.cy) ? num(ext.cy) / num(chExt.cy) : 1;
      local = { sx, sy, tx: num(off.x) - num(chOff.x) * sx, ty: num(off.y) - num(chOff.y) * sy };
    }
    const next = compose(t, local);
    for (const child of parts) {
      const ct = tagOf(child);
      if (ct === 'wps:wsp' || ct === 'wpg:grpSp') walk(child, next, ctx);
    }
    return;
  }
  for (const child of kids(node)) walk(child, t, ctx);
}

export interface SvgDrawing {
  svg: string;
  /** Natural size in EMU (English Metric Units). */
  widthEmu: number;
  heightEmu: number;
}

/** True when the <w:drawing> holds shapes (and no picture): something this module can draw. */
export function isShapeDrawing(drawingXml: string): boolean {
  return /<wps:wsp\b/.test(drawingXml) && !/<a:blip\b/.test(drawingXml);
}

export function drawingToSvg(drawingXml: string, themeXml?: string): SvgDrawing | null {
  if (!isShapeDrawing(drawingXml)) return null;
  const tree = parser.parse(drawingXml) as Node[];
  const drawing = tree.find((n) => tagOf(n) === 'w:drawing');
  if (!drawing) return null;
  const anchor = kids(drawing).find((n) => tagOf(n) === 'wp:anchor' || tagOf(n) === 'wp:inline');
  const extent = anchor && find(kids(anchor), 'wp:extent');
  const widthEmu = num(attrs(extent || {}).cx);
  const heightEmu = num(attrs(extent || {}).cy);
  if (!widthEmu || !heightEmu) return null;
  // A lone arrow / line / small badge is decoration, not a figure.
  if (widthEmu < 1270000 || heightEmu < 635000) return null;

  const ctx: Ctx = { colors: parseThemeColors(themeXml), defs: new Set(), out: [] };
  walk(drawing, IDENTITY, ctx);
  const shapes = ctx.out.filter((s) => !s.startsWith('<defs'));
  if (shapes.length < 2) return null;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthEmu / EMU_PER_PT} ${heightEmu / EMU_PER_PT}" width="${Math.round(widthEmu / 9525)}" height="${Math.round(heightEmu / 9525)}">` +
    `<rect width="100%" height="100%" fill="#FFFFFF"/>${ctx.out.join('')}</svg>`;
  return { svg, widthEmu, heightEmu };
}

/** Rasterise SVG to a PNG data URL (browser only; resolves null elsewhere or on failure). */
export async function svgToPngDataUrl(svg: string, widthPx = 1600): Promise<string | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  try {
    const m = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    const ratio = m ? Number(m[2]) / Number(m[1]) : 0.5;
    const w = widthPx;
    const h = Math.round(widthPx * ratio);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.width = w;
    img.height = h;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg load failed'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    if (!g) return null;
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
