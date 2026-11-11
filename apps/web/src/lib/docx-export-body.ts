import {
  AlignmentType,
  ImageRun,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  BorderStyle,
} from 'docx';
import type { PaperReference, PaperSection } from '@/types/paper';
import type { ResolvedTheme } from './theme-config';
import { latexToDocxMath, splitTextWithMath } from './docx-math';
import { displayHeading } from './headings';
import { buildDocxTable } from './docx-table';
import { stripCaptionLabel } from './docx-table-extras';
import type { DocxImage } from './docx-export-assets';
import { ABSTRACT_FILL, COL_W, FONT_SANS, FONT_SERIF, TEXT_W } from './docx-export-front';

export type Block = Paragraph | Table;
/** Consecutive blocks that share a column layout: 2-column body, or a full-width figure/table. */
export interface Segment {
  fullWidth: boolean;
  children: Block[];
}

const BODY_SIZE = 18; // 9 pt, as printed
const CITE_RE = /\s*\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g;

/** Text with inline $…$ math and "[3,4]" citations (printed as coloured superscripts, like the PDF). */
export function richRuns(text: string, color: string, font = FONT_SERIF, size = BODY_SIZE): Array<TextRun | ReturnType<typeof latexToDocxMath>> {
  const out: Array<TextRun | ReturnType<typeof latexToDocxMath>> = [];
  let last = 0;
  const pushText = (t: string) => {
    for (const c of splitTextWithMath(t)) out.push(c.kind === 'text' ? new TextRun({ text: c.value, font, size }) : c.math);
  };
  for (const m of text.matchAll(CITE_RE)) {
    pushText(text.slice(last, m.index));
    out.push(new TextRun({ text: m[1].replace(/\s+/g, ''), font, size, superScript: true, color }));
    last = (m.index ?? 0) + m[0].length;
  }
  pushText(text.slice(last));
  return out;
}

const bodyPara = (text: string, color: string) =>
  new Paragraph({ style: 'BodyText', alignment: AlignmentType.JUSTIFIED, children: richRuns(text, color) });

function headingPara(sec: PaperSection, theme: ResolvedTheme, color: string): Paragraph {
  const title = displayHeading(sec.title || '', theme.keepSectionNumbers);
  const level = sec.type === 'h1' ? 1 : sec.type === 'h2' ? 2 : 3;
  return new Paragraph({
    style: `Heading${level}`,
    keepNext: true,
    children: [
      new TextRun({
        text: level === 1 ? title.toUpperCase() : title,
        font: FONT_SANS,
        size: level === 1 ? 24 : 20,
        bold: true,
        italics: level === 3,
        color,
      }),
    ],
  });
}

/** Figure in a light-blue box: picture, then "Hình N: caption", like the printed journal. */
function figureBlock(sec: PaperSection, image: DocxImage | undefined, full: boolean, color: string, lang: 'vi' | 'en'): Table {
  const fig = sec.figure!;
  const boxW = full ? TEXT_W : COL_W;
  const scale = Math.min(100, fig.scalePercent ?? 100) / 100;
  const widthPx = Math.round(((boxW - 300) / 15) * scale);
  const pic = image
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          children: [new ImageRun({ type: image.type, data: image.data, transformation: { width: widthPx, height: Math.round((widthPx * image.height) / image.width) } })],
        }),
      ]
    : [];
  const caption = new Paragraph({
    style: 'FigureCaption',
    children: [
      new TextRun({ text: `${lang === 'en' ? 'Figure' : 'Hình'} ${fig.num}: `, font: FONT_SANS, size: 17, bold: true, color }),
      new TextRun({ text: stripCaptionLabel(fig.caption || ''), font: FONT_SANS, size: 17 }),
      ...(fig.source ? [new TextRun({ text: ` ${fig.source}`, font: FONT_SANS, size: 17 })] : []),
    ],
  });
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return new Table({
    width: { size: boxW, type: WidthType.DXA },
    columnWidths: [boxW],
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: boxW, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: ABSTRACT_FILL, color: 'auto' },
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: [...pic, caption],
          }),
        ],
      }),
    ],
  });
}

function equationPara(sec: PaperSection, full: boolean): Paragraph {
  const width = full ? TEXT_W : COL_W;
  const children: Array<TextRun | ReturnType<typeof latexToDocxMath>> = [new TextRun({ text: '\t' }), latexToDocxMath(sec.equation!.latex)];
  if (sec.equation!.numbered) children.push(new TextRun({ text: `\t(${sec.equation!.num ?? ''})`, font: FONT_SERIF, size: BODY_SIZE }));
  return new Paragraph({
    style: 'Equation',
    tabStops: [
      { type: TabStopType.CENTER, position: Math.round(width / 2) },
      { type: TabStopType.RIGHT, position: width },
    ],
    children,
  });
}

/** Body sections and references, split into 2-column runs and full-width figure/table runs. */
export function buildBody(
  sections: PaperSection[],
  references: PaperReference[],
  ctx: { theme: ResolvedTheme; color: string; figures: Map<string, DocxImage>; lang: 'vi' | 'en'; refTitle: string }
): Segment[] {
  const segments: Segment[] = [{ fullWidth: false, children: [] }];
  const push = (full: boolean, ...blocks: Block[]) => {
    let seg = segments[segments.length - 1];
    if (seg.fullWidth !== full) segments.push((seg = { fullWidth: full, children: [] }));
    seg.children.push(...blocks);
  };
  const { theme, color } = ctx;
  for (const sec of sections) {
    if ((sec.type === 'h1' || sec.type === 'h2' || sec.type === 'h3') && sec.title) {
      push(false, headingPara(sec, theme, color));
      if (sec.content) push(false, bodyPara(sec.content, color));
    } else if (sec.type === 'paragraph' && sec.content) {
      push(false, bodyPara(sec.content, color));
    } else if ((sec.type === 'quote' || sec.type === 'box') && sec.content) {
      push(false, new Paragraph({ style: 'BodyText', indent: { left: 360, right: 360 }, children: richRuns(sec.content, color).map((r) => r) }));
    } else if (sec.type === 'equation' && sec.equation?.latex.trim()) {
      push(false, equationPara(sec, false));
    } else if (sec.type === 'figure' && sec.figure) {
      const full = sec.figure.columnSpan === '2-column' || (sec.figure.columnSpan !== '1-column' && !!sec.figure.isFullWidth);
      push(full, figureBlock(sec, ctx.figures.get(sec.id), full, color, ctx.lang), new Paragraph({ spacing: { after: 120 }, children: [] }));
    } else if (sec.type === 'table' && sec.table) {
      const t = sec.table;
      const full = t.columnSpan === '2-column' || (t.columnSpan !== '1-column' && t.isFullWidth !== false && (t.headers?.length ?? 0) > 3);
      push(full, ...buildDocxTable(t, theme, full ? TEXT_W : COL_W));
    }
  }
  if (references.length > 0) {
    push(false, new Paragraph({ style: 'SectionReferences', keepNext: true, children: [new TextRun({ text: ctx.refTitle, font: FONT_SANS, size: 24, bold: true, color })] }));
    for (const ref of references) {
      push(
        false,
        new Paragraph({
          style: 'Reference',
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 280, hanging: 280 },
          children: [new TextRun({ text: `${ref.id}.\t`, font: FONT_SANS, size: 15, color }), new TextRun({ text: ref.raw, font: FONT_SANS, size: 15 })],
          tabStops: [{ type: TabStopType.LEFT, position: 280 }],
        })
      );
    }
  }
  return segments.filter((s) => s.children.length > 0);
}
