import { XMLParser } from 'fast-xml-parser';
import { StyleInfo } from '../types/raw-doc';

/**
 * StyleResolver parses word/styles.xml and resolves style IDs to human-readable style names,
 * as well as tracking style inheritance chains (w:basedOn).
 */
export class StyleResolver {
  private readonly styles = new Map<string, StyleInfo>();
  private readonly normalizedIdMap = new Map<string, string>();
  private readonly nameToIdMap = new Map<string, string>();

  public constructor(stylesXml?: string) {
    if (stylesXml) {
      this.parseStyles(stylesXml);
    }
  }

  /**
   * Parse the word/styles.xml document into StyleInfo records.
   */
  private parseStyles(stylesXml: string): void {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (name) => name === 'w:style',
      });
      const parsed = parser.parse(stylesXml);
      const root = parsed['w:styles'] || parsed.styles;
      const rawStyles = root?.['w:style'] || [];

      for (const s of rawStyles) {
        const id = s['@_w:styleId'] || s['@_styleId'];
        if (!id) continue;

        const nameVal = s['w:name']?.['@_w:val'] || s.name?.['@_val'];
        const name = nameVal || id;
        const basedOn = s['w:basedOn']?.['@_w:val'] || s.basedOn?.['@_val'];
        const type = s['@_w:type'] || s['@_type'];
        const next = s['w:next']?.['@_w:val'] || s.next?.['@_val'];
        const customVal = s['@_w:customStyle'] || s['@_customStyle'];
        const isCustom = customVal === '1' || customVal === 'true';

        const info: StyleInfo = {
          id,
          name,
          basedOn,
          type,
          next,
          isCustom,
        };

        this.styles.set(id, info);
        this.normalizedIdMap.set(id.toLowerCase(), id);
        this.nameToIdMap.set(name.toLowerCase(), id);
      }
    } catch {
      // In case of parsing error, styles map remains partial or empty
    }
  }

  /**
   * Retrieve style information by style ID (case-insensitive fallback).
   */
  public getStyle(styleId: string): StyleInfo | undefined {
    if (this.styles.has(styleId)) {
      return this.styles.get(styleId);
    }
    const resolvedId = this.normalizedIdMap.get(styleId.toLowerCase());
    if (resolvedId) {
      return this.styles.get(resolvedId);
    }
    return undefined;
  }

  /**
   * Resolve a paragraph or character style ID to its canonical style name.
   * If not found, returns the original styleId (or undefined).
   */
  public resolveStyleName(styleId?: string): string | undefined {
    if (!styleId) return undefined;
    const style = this.getStyle(styleId);
    return style ? style.name : styleId;
  }

  /**
   * Lookup style ID by canonical style name (case-insensitive).
   */
  public resolveStyleId(styleName: string): string | undefined {
    return this.nameToIdMap.get(styleName.toLowerCase());
  }

  /**
   * Computes the style inheritance hierarchy for a given style ID.
   * Returns an array starting with the styleId and walking up the basedOn chain.
   * Guaranteed to avoid infinite loops on circular definitions.
   */
  public getInheritanceChain(styleId: string): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();
    let currentId: string | undefined = styleId;

    while (currentId && !visited.has(currentId.toLowerCase())) {
      chain.push(currentId);
      visited.add(currentId.toLowerCase());

      const style = this.getStyle(currentId);
      currentId = style?.basedOn;
    }

    return chain;
  }

  /**
   * Check whether a given style ID is derived from an ancestor style (by ID or Name).
   */
  public isBasedOn(styleId: string, ancestorNameOrId: string): boolean {
    const chain = this.getInheritanceChain(styleId);
    const target = ancestorNameOrId.toLowerCase();

    for (const id of chain) {
      if (id.toLowerCase() === target) return true;
      const s = this.getStyle(id);
      if (s && s.name.toLowerCase() === target) return true;
    }

    return false;
  }

  /**
   * Returns all parsed styles.
   */
  public getAllStyles(): Map<string, StyleInfo> {
    return new Map(this.styles);
  }
}
