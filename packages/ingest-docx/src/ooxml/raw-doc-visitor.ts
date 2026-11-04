import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import {
  RawBlock,
  RawCell,
  RawDoc,
  RawDocVisitorOptions,
  RawDrawing,
  RawField,
  RawMath,
  RawParagraph,
  RawRow,
  RawRun,
  RawTable,
} from '../types/raw-doc';
import { DocxPackage } from '../package/docx-package';
import { StyleResolver } from './style-resolver';
import {
  FxpNode,
  findChild,
  findDescendant,
  getAttr,
  getChildren,
  getTagName,
  getTextContent,
} from './xml-node';

/**
 * RawDocVisitor traverses word/document.xml isomorphically using fast-xml-parser
 * and produces a normalized RawDoc model with blocks, runs, tables, math, and drawings.
 */
export class RawDocVisitor {
  private readonly options: Required<RawDocVisitorOptions>;
  private readonly xmlBuilder: XMLBuilder;
  private styleResolver: StyleResolver;
  private rels: Map<string, string>;
  private media: Map<string, Uint8Array>;

  public constructor(options?: RawDocVisitorOptions) {
    this.options = {
      trackChanges: options?.trackChanges ?? 'acceptAll',
    };
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      preserveOrder: true,
      attributeNamePrefix: '@_',
    });
    this.styleResolver = new StyleResolver();
    this.rels = new Map();
    this.media = new Map();
  }

  /**
   * Parse a complete DocxPackage into a RawDoc representation.
   */
  public visit(pkg: DocxPackage): RawDoc {
    this.styleResolver = new StyleResolver(pkg.stylesXml);
    this.rels = pkg.rels;
    this.media = pkg.media;

    const blocks = this.visitXml(pkg.documentXml);
    return {
      blocks,
      styles: this.styleResolver.getAllStyles(),
      media: this.media,
      rels: this.rels,
    };
  }

  /**
   * Traverse document.xml text directly.
   */
  public visitXml(
    documentXml: string,
    styleResolver?: StyleResolver,
    rels?: Map<string, string>,
    media?: Map<string, Uint8Array>
  ): RawBlock[] {
    if (styleResolver) this.styleResolver = styleResolver;
    if (rels) this.rels = rels;
    if (media) this.media = media;

    const parser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
      attributeNamePrefix: '@_',
      trimValues: false,
    });
    const parsed = parser.parse(documentXml) as FxpNode[];

    // Find w:document -> w:body
    const docNode = parsed.find((n) => getTagName(n) === 'w:document');
    if (!docNode) return [];

    const bodyNode = findChild(docNode, 'w:body');
    if (!bodyNode) return [];

    const blocks: RawBlock[] = [];
    this.traverseBlocks(getChildren(bodyNode), blocks);
    return blocks;
  }

  /**
   * Recursively unwrap and accumulate top-level blocks.
   */
  private traverseBlocks(nodes: FxpNode[], blocks: RawBlock[]): void {
    for (const node of nodes) {
      const tag = getTagName(node);
      if (tag === 'w:p') {
        const para = this.parseParagraph(node);
        blocks.push(para);
      } else if (tag === 'w:tbl') {
        const table = this.parseTable(node);
        blocks.push(table);
      } else if (tag === 'w:sdt') {
        const sdtContent = findChild(node, 'w:sdtContent');
        if (sdtContent) {
          this.traverseBlocks(getChildren(sdtContent), blocks);
        }
      }
    }
  }

  /**
   * Parse a paragraph (<w:p>) node.
   */
  private parseParagraph(pNode: FxpNode): RawParagraph {
    let styleId: string | undefined;
    let alignment: string | undefined;

    const pPr = findChild(pNode, 'w:pPr');
    if (pPr) {
      const pStyleNode = findChild(pPr, 'w:pStyle');
      if (pStyleNode) {
        styleId = getAttr(pStyleNode, 'val');
      }
      const jcNode = findChild(pPr, 'w:jc');
      if (jcNode) {
        alignment = getAttr(jcNode, 'val');
      }
    }

    const styleName = this.styleResolver.resolveStyleName(styleId);
    const runs: RawRun[] = [];
    const math: RawMath[] = [];
    const drawings: RawDrawing[] = [];
    const fields: RawField[] = [];

    let fieldState: 'idle' | 'instruction' | 'result' = 'idle';
    let currentInstr = '';
    let currentResult = '';

    const processChild = (node: FxpNode) => {
      const tag = getTagName(node);
      if (!tag) return;

      if (tag === 'w:r') {
        this.parseRun(node, runs, drawings, {
          onFieldChar: (type) => {
            if (type === 'begin') {
              fieldState = 'instruction';
              currentInstr = '';
              currentResult = '';
            } else if (type === 'separate') {
              fieldState = 'result';
            } else if (type === 'end') {
              if (currentInstr.trim()) {
                fields.push({
                  instruction: currentInstr.trim(),
                  resultText: currentResult.trim(),
                });
              }
              fieldState = 'idle';
            }
          },
          onInstrText: (text) => {
            if (fieldState === 'instruction') {
              currentInstr += text;
            }
          },
          onText: (text) => {
            if (fieldState === 'result') {
              currentResult += text;
            }
          },
        });
      } else if (tag === 'm:oMath') {
        const omml = this.xmlBuilder.build([node]);
        math.push({ omml, isBlock: false });
        const mathText = this.extractMathText(node);
        if (mathText) runs.push({ text: mathText });
      } else if (tag === 'm:oMathPara') {
        const omml = this.xmlBuilder.build([node]);
        math.push({ omml, isBlock: true });
        const mathText = this.extractMathText(node);
        if (mathText) runs.push({ text: mathText });
      } else if (tag === 'w:drawing') {
        const d = this.parseDrawing(node);
        if (d) drawings.push(d);
      } else if (tag === 'w:fldSimple') {
        const instr = getAttr(node, 'instr') || '';
        const startRunIdx = runs.length;
        for (const child of getChildren(node)) {
          processChild(child);
        }
        const resultText = runs
          .slice(startRunIdx)
          .map((r) => r.text)
          .join('');
        fields.push({ instruction: instr.trim(), resultText });
      } else if (tag === 'w:ins') {
        if (this.options.trackChanges === 'acceptAll') {
          for (const child of getChildren(node)) processChild(child);
        }
      } else if (tag === 'w:del') {
        if (this.options.trackChanges === 'rejectAll') {
          for (const child of getChildren(node)) processChild(child);
        }
      } else if (tag === 'w:hyperlink' || tag === 'w:smartTag' || tag === 'w:dir' || tag === 'w:bdo') {
        for (const child of getChildren(node)) processChild(child);
      } else if (tag === 'w:sdt') {
        const sdtContent = findChild(node, 'w:sdtContent');
        if (sdtContent) {
          for (const child of getChildren(sdtContent)) processChild(child);
        }
      }
    };

    for (const child of getChildren(pNode)) {
      if (getTagName(child) !== 'w:pPr') {
        processChild(child);
      }
    }

    const rawText = runs.map((r) => r.text).join('');

    return {
      type: 'paragraph',
      styleId,
      styleName,
      runs,
      math: math.length > 0 ? math : undefined,
      drawings: drawings.length > 0 ? drawings : undefined,
      fields: fields.length > 0 ? fields : undefined,
      rawText,
      alignment,
    };
  }

  /**
   * Parse a text run (<w:r>).
   */
  private parseRun(
    rNode: FxpNode,
    runs: RawRun[],
    drawings: RawDrawing[],
    fieldCallbacks: {
      onFieldChar: (type?: string) => void;
      onInstrText: (text: string) => void;
      onText: (text: string) => void;
    }
  ): void {
    let bold: boolean | undefined;
    let italic: boolean | undefined;
    let sup: boolean | undefined;
    let sub: boolean | undefined;
    let code: boolean | undefined;
    let font: string | undefined;
    let size: number | undefined;

    const rPr = findChild(rNode, 'w:rPr');
    if (rPr) {
      const bNode = findChild(rPr, 'w:b');
      if (bNode) {
        const bVal = getAttr(bNode, 'val');
        bold = bVal !== '0' && bVal !== 'false';
      }

      const iNode = findChild(rPr, 'w:i');
      if (iNode) {
        const iVal = getAttr(iNode, 'val');
        italic = iVal !== '0' && iVal !== 'false';
      }

      const vertAlignNode = findChild(rPr, 'w:vertAlign');
      if (vertAlignNode) {
        const val = getAttr(vertAlignNode, 'val');
        if (val === 'superscript') sup = true;
        else if (val === 'subscript') sub = true;
      }

      const fontsNode = findChild(rPr, 'w:rFonts');
      if (fontsNode) {
        font = getAttr(fontsNode, 'ascii') || getAttr(fontsNode, 'hAnsi');
        if (font && /courier|consolas|monaco|monospace|menlo/i.test(font)) {
          code = true;
        }
      }

      const rStyleNode = findChild(rPr, 'w:rStyle');
      if (rStyleNode) {
        const sVal = getAttr(rStyleNode, 'val');
        if (sVal && /code|verbatim/i.test(sVal)) {
          code = true;
        }
      }

      const szNode = findChild(rPr, 'w:sz');
      if (szNode) {
        const szVal = getAttr(szNode, 'val');
        if (szVal) size = Number(szVal) / 2;
      }
    }

    const appendText = (text: string) => {
      runs.push({
        text,
        bold: bold || undefined,
        italic: italic || undefined,
        sup: sup || undefined,
        sub: sub || undefined,
        code: code || undefined,
        font: font || undefined,
        size: size || undefined,
      });
      fieldCallbacks.onText(text);
    };

    for (const child of getChildren(rNode)) {
      const tag = getTagName(child);
      if (tag === 'w:t' || tag === 'w:delText') {
        const tText = getTextContent(child);
        if (tText) appendText(tText);
      } else if (tag === 'w:tab') {
        appendText('\t');
      } else if (tag === 'w:br' || tag === 'w:cr') {
        appendText('\n');
      } else if (tag === 'w:sym') {
        const char = getAttr(child, 'char');
        if (char) {
          appendText(String.fromCharCode(parseInt(char, 16)));
        }
      } else if (tag === 'w:drawing') {
        const d = this.parseDrawing(child);
        if (d) drawings.push(d);
      } else if (tag === 'w:fldChar') {
        fieldCallbacks.onFieldChar(getAttr(child, 'fldCharType'));
      } else if (tag === 'w:instrText') {
        fieldCallbacks.onInstrText(getTextContent(child));
      }
    }
  }

  /**
   * Parse an inline or anchored drawing (<w:drawing>).
   */
  private parseDrawing(drawingNode: FxpNode): RawDrawing | undefined {
    const blip = findDescendant(drawingNode, 'a:blip');
    const rId = blip
      ? getAttr(blip, 'r:embed') ||
        getAttr(blip, 'embed') ||
        getAttr(blip, 'r:link') ||
        getAttr(blip, 'link')
      : undefined;

    if (!rId) return undefined;

    const filename = this.rels.get(rId);

    let description: string | undefined;
    const docPr = findDescendant(drawingNode, 'wp:docPr');
    if (docPr) {
      description =
        getAttr(docPr, 'descr') ||
        getAttr(docPr, 'title') ||
        getAttr(docPr, 'name');
    }

    let width: number | undefined;
    let height: number | undefined;
    const extent = findDescendant(drawingNode, 'wp:extent');
    if (extent) {
      const cx = getAttr(extent, 'cx');
      const cy = getAttr(extent, 'cy');
      if (cx) width = Math.round(Number(cx) / 12700);
      if (cy) height = Math.round(Number(cy) / 12700);
    }

    return {
      rId,
      filename,
      description,
      width,
      height,
    };
  }

  /**
   * Parse a table (<w:tbl>) node.
   */
  private parseTable(tblNode: FxpNode): RawTable {
    const rows: RawRow[] = [];

    for (const child of getChildren(tblNode)) {
      if (getTagName(child) === 'w:tr') {
        const trPr = findChild(child, 'w:trPr');
        const isHeader = Boolean(trPr && findChild(trPr, 'w:tblHeader'));
        const cells: RawCell[] = [];

        for (const trChild of getChildren(child)) {
          if (getTagName(trChild) === 'w:tc') {
            const tcPr = findChild(trChild, 'w:tcPr');
            let gridSpan = 1;
            let vMerge: 'restart' | 'continue' | undefined;
            let width: number | undefined;

            if (tcPr) {
              const gsNode = findChild(tcPr, 'w:gridSpan');
              if (gsNode) {
                gridSpan = Number(getAttr(gsNode, 'val') || 1);
              }
              const vmNode = findChild(tcPr, 'w:vMerge');
              if (vmNode) {
                const vmVal = getAttr(vmNode, 'val');
                vMerge = vmVal === 'restart' ? 'restart' : 'continue';
              }
              const tcWNode = findChild(tcPr, 'w:tcW');
              if (tcWNode) {
                const wVal = getAttr(tcWNode, 'w') || getAttr(tcWNode, 'val');
                if (wVal) width = Number(wVal);
              }
            }

            const paragraphs: RawParagraph[] = [];
            for (const tcContent of getChildren(trChild)) {
              const cTag = getTagName(tcContent);
              if (cTag === 'w:p') {
                paragraphs.push(this.parseParagraph(tcContent));
              } else if (cTag === 'w:sdt') {
                const sdtContent = findChild(tcContent, 'w:sdtContent');
                if (sdtContent) {
                  for (const sc of getChildren(sdtContent)) {
                    if (getTagName(sc) === 'w:p') {
                      paragraphs.push(this.parseParagraph(sc));
                    }
                  }
                }
              }
            }

            cells.push({
              paragraphs,
              gridSpan,
              vMerge,
              width,
            });
          }
        }

        rows.push({
          cells,
          isHeader: isHeader || undefined,
        });
      }
    }

    const rowCount = rows.length;
    const colCount = Math.max(
      ...rows.map((r) =>
        r.cells.reduce((sum, c) => sum + (c.gridSpan || 1), 0)
      ),
      0
    );

    return {
      type: 'table',
      rows,
      colCount,
      rowCount,
    };
  }

  /**
   * Helper to extract plain text formula representation from m:t tags.
   */
  private extractMathText(mathNode: FxpNode): string {
    let text = '';
    const traverse = (node: FxpNode) => {
      const tag = getTagName(node);
      if (tag === 'm:t') {
        text += getTextContent(node);
      } else {
        for (const child of getChildren(node)) {
          traverse(child);
        }
      }
    };
    traverse(mathNode);
    return text;
  }
}
