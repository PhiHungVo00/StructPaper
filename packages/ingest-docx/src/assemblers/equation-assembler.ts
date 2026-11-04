import { XMLParser } from 'fast-xml-parser';
import type { EquationBlock } from '@structpaper/doc-model';
import type { RawParagraph } from '../types/raw-doc';
import {
  FxpNode,
  getTagName,
  getAttr,
  getChildren,
  findChild,
  findChildren,
  findDescendant,
  getTextContent,
} from '../ooxml/xml-node';

/**
 * EquationAssembler parses OMML (Office Math Markup Language) into clean LaTeX,
 * extracts equation numbers/labels, and builds EquationBlock models.
 */
export class EquationAssembler {
  private readonly xmlParser: XMLParser;
  private idCounter = 0;

  public constructor() {
    this.xmlParser = new XMLParser({
      preserveOrder: true,
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: false,
    });
  }

  /**
   * Converts an OMML XML string into a LaTeX mathematical expression.
   */
  public ommlToLatex(ommlString: string): string {
    if (!ommlString || !ommlString.trim()) return '';

    try {
      const ast = this.xmlParser.parse(ommlString) as FxpNode[];
      if (!Array.isArray(ast) || ast.length === 0) {
        return this.fallbackExtract(ommlString);
      }

      const latex = ast.map((node) => this.traverse(node)).join('').trim();
      return latex.length > 0 ? latex : this.fallbackExtract(ommlString);
    } catch {
      return this.fallbackExtract(ommlString);
    }
  }

  /**
   * Assembles a RawParagraph with math content into an EquationBlock.
   */
  public assembleEquation(paragraph: RawParagraph, id?: string): EquationBlock {
    const eqId = id || `eq-${++this.idCounter}`;

    const { numbered, label, cleanedText } = this.extractEquationLabel(paragraph.rawText);

    let latex = '';
    if (paragraph.math && paragraph.math.length > 0) {
      latex = this.ommlToLatex(paragraph.math[0].omml);
    }

    if (!latex) {
      latex = cleanedText || paragraph.rawText;
    }

    return {
      type: 'equation',
      id: eqId,
      latex,
      omml: paragraph.math?.[0]?.omml,
      numbered,
      ...(label ? { label } : {}),
      status: 'ok',
    };
  }

  private traverse(node: FxpNode): string {
    const tag = getTagName(node);
    if (!tag) return '';

    switch (tag) {
      case 'm:oMath':
      case 'm:oMathPara':
      case 'm:e':
      case 'm:num':
      case 'm:den':
      case 'm:sup':
      case 'm:sub':
      case 'm:deg':
      case 'm:fName':
        return getChildren(node)
          .map((child) => this.traverse(child))
          .join('');

      case 'm:f': {
        const numNode = findChild(node, 'm:num');
        const denNode = findChild(node, 'm:den');
        const num = numNode ? this.traverse(numNode) : '';
        const den = denNode ? this.traverse(denNode) : '';
        return `\\frac{${num}}{${den}}`;
      }

      case 'm:rad': {
        const eNode = findChild(node, 'm:e');
        const degNode = findChild(node, 'm:deg');
        const degHide = findDescendant(node, 'm:degHide');
        const eText = eNode ? this.traverse(eNode) : '';
        const degText = degNode ? this.traverse(degNode).trim() : '';

        if (degText && !degHide) {
          return `\\sqrt[${degText}]{${eText}}`;
        }
        return `\\sqrt{${eText}}`;
      }

      case 'm:sSup': {
        const eNode = findChild(node, 'm:e');
        const supNode = findChild(node, 'm:sup');
        const eText = eNode ? this.traverse(eNode) : '';
        const supText = supNode ? this.traverse(supNode) : '';
        return `{${eText}}^{${supText}}`;
      }

      case 'm:sSub': {
        const eNode = findChild(node, 'm:e');
        const subNode = findChild(node, 'm:sub');
        const eText = eNode ? this.traverse(eNode) : '';
        const subText = subNode ? this.traverse(subNode) : '';
        return `{${eText}}_{${subText}}`;
      }

      case 'm:sSubSup': {
        const eNode = findChild(node, 'm:e');
        const subNode = findChild(node, 'm:sub');
        const supNode = findChild(node, 'm:sup');
        const eText = eNode ? this.traverse(eNode) : '';
        const subText = subNode ? this.traverse(subNode) : '';
        const supText = supNode ? this.traverse(supNode) : '';
        return `{${eText}}_{${subText}}^{${supText}}`;
      }

      case 'm:d': {
        const dPr = findChild(node, 'm:dPr');
        const begNode = dPr ? findChild(dPr, 'm:begChr') : undefined;
        const endNode = dPr ? findChild(dPr, 'm:endChr') : undefined;

        const begChr = (begNode ? getAttr(begNode, 'val') : getAttr(dPr || {}, 'begChr')) ?? '(';
        const endChr = (endNode ? getAttr(endNode, 'val') : getAttr(dPr || {}, 'endChr')) ?? ')';

        const elements = findChildren(node, 'm:e');
        const inner = elements.map((e) => this.traverse(e)).join('');

        const left = this.mapDelimiter(begChr, 'left');
        const right = this.mapDelimiter(endChr, 'right');

        return `${left} ${inner} ${right}`;
      }

      case 'm:nary': {
        const naryPr = findChild(node, 'm:naryPr');
        const chrNode = naryPr ? findChild(naryPr, 'm:chr') : undefined;
        const chr = (chrNode ? getAttr(chrNode, 'val') : getAttr(naryPr || {}, 'chr')) ?? '∑';

        const subNode = findChild(node, 'm:sub');
        const supNode = findChild(node, 'm:sup');
        const eNode = findChild(node, 'm:e');

        const op = this.mapNaryOperator(chr);
        const subText = subNode ? this.traverse(subNode).trim() : '';
        const supText = supNode ? this.traverse(supNode).trim() : '';
        const eText = eNode ? this.traverse(eNode) : '';

        let res = op;
        if (subText) res += `_{${subText}}`;
        if (supText) res += `^{${supText}}`;
        res += `{${eText}}`;
        return res;
      }

      case 'm:r': {
        return this.sanitizeMathRun(getTextContent(node));
      }

      default: {
        return getChildren(node)
          .map((child) => this.traverse(child))
          .join('');
      }
    }
  }

  private mapDelimiter(chr: string, side: 'left' | 'right'): string {
    const prefix = side === 'left' ? '\\left' : '\\right';
    if (!chr) return `${prefix}.`;
    if (chr === '(' || chr === ')') return `${prefix}${chr}`;
    if (chr === '[' || chr === ']') return `${prefix}${chr}`;
    if (chr === '{' || chr === '}') return `${prefix}\\${chr}`;
    if (chr === '|') return `${prefix}|`;
    return `${prefix}${chr}`;
  }

  private mapNaryOperator(chr: string): string {
    switch (chr) {
      case '∑':
        return '\\sum';
      case '∫':
        return '\\int';
      case '∬':
        return '\\iint';
      case '∭':
        return '\\iiint';
      case '∮':
        return '\\oint';
      case '∏':
        return '\\prod';
      case '⋃':
        return '\\bigcup';
      case '⋂':
        return '\\bigcap';
      default:
        return '\\sum';
    }
  }

  private sanitizeMathRun(text: string): string {
    return text
      .replace(/±/g, '\\pm ')
      .replace(/×/g, '\\times ')
      .replace(/÷/g, '\\div ')
      .replace(/≤/g, '\\le ')
      .replace(/≥/g, '\\ge ')
      .replace(/≠/g, '\\ne ')
      .replace(/≈/g, '\\approx ')
      .replace(/∞/g, '\\infty ')
      .replace(/α/g, '\\alpha ')
      .replace(/β/g, '\\beta ')
      .replace(/γ/g, '\\gamma ')
      .replace(/θ/g, '\\theta ')
      .replace(/λ/g, '\\lambda ')
      .replace(/μ/g, '\\mu ')
      .replace(/π/g, '\\pi ')
      .replace(/σ/g, '\\sigma ')
      .replace(/ω/g, '\\omega ')
      .replace(/Δ/g, '\\Delta ')
      .replace(/Σ/g, '\\Sigma ')
      .replace(/Ω/g, '\\Omega ')
      .replace(/→/g, '\\to ')
      .replace(/∂/g, '\\partial ');
  }

  private extractEquationLabel(text: string): {
    numbered: boolean;
    label?: string;
    cleanedText: string;
  } {
    const trimmed = text.trim();
    const labelMatch = trimmed.match(/\((\d+(?:\.\d+)*)\)\s*$/) ||
      trimmed.match(/\bEq(?:uation)?\.?\s*\(?(\d+(?:\.\d+)*)\)?\s*$/i);

    if (labelMatch) {
      const label = labelMatch[1];
      const cleanedText = trimmed.slice(0, labelMatch.index).trim();
      return { numbered: true, label, cleanedText };
    }

    return { numbered: false, cleanedText: trimmed };
  }

  private fallbackExtract(xml: string): string {
    const matches = xml.match(/<m:t[^>]*>(.*?)<\/m:t>/g);
    if (matches && matches.length > 0) {
      return matches
        .map((m) => m.replace(/<[^>]+>/g, ''))
        .join('')
        .trim();
    }
    return '';
  }
}
