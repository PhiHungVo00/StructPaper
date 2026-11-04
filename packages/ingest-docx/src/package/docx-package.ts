import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface DocxPackageParts {
  documentXml: string;
  stylesXml?: string;
  numberingXml?: string;
  footnotesXml?: string;
  endnotesXml?: string;
  relsXml?: string;
}

/**
 * DocxPackage opens a .docx container (ZIP format) and extracts
 * core OOXML XML parts, relationship maps, and media assets.
 * 
 * Runs isomorphically across Node.js, modern browsers, and Web Workers.
 */
export class DocxPackage {
  public readonly zip: JSZip;
  public readonly documentXml: string;
  public readonly stylesXml?: string;
  public readonly numberingXml?: string;
  public readonly footnotesXml?: string;
  public readonly endnotesXml?: string;
  public readonly relsXml?: string;
  public readonly rels: Map<string, string>;
  public readonly media: Map<string, Uint8Array>;

  private constructor(
    zip: JSZip,
    parts: DocxPackageParts,
    rels: Map<string, string>,
    media: Map<string, Uint8Array>
  ) {
    this.zip = zip;
    this.documentXml = parts.documentXml;
    this.stylesXml = parts.stylesXml;
    this.numberingXml = parts.numberingXml;
    this.footnotesXml = parts.footnotesXml;
    this.endnotesXml = parts.endnotesXml;
    this.relsXml = parts.relsXml;
    this.rels = rels;
    this.media = media;
  }

  /**
   * Loads and unpacks a DOCX archive from ArrayBuffer, Uint8Array, Buffer, or Blob.
   */
  public static async load(input: ArrayBuffer | Uint8Array | Blob): Promise<DocxPackage> {
    let data: ArrayBuffer | Uint8Array;
    if (typeof Blob !== 'undefined' && input instanceof Blob) {
      data = await input.arrayBuffer();
    } else {
      data = input as ArrayBuffer | Uint8Array;
    }

    const zip = await JSZip.loadAsync(data);

    // 1. Extract document.xml (mandatory)
    const docFile = zip.file('word/document.xml');
    if (!docFile) {
      throw new Error('Invalid DOCX package: missing word/document.xml');
    }
    const documentXml = await docFile.async('text');

    // 2. Extract optional XML parts
    const stylesXml = await zip.file('word/styles.xml')?.async('text');
    const numberingXml = await zip.file('word/numbering.xml')?.async('text');
    const footnotesXml = await zip.file('word/footnotes.xml')?.async('text');
    const endnotesXml = await zip.file('word/endnotes.xml')?.async('text');
    const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('text');

    // 3. Parse relationships from word/_rels/document.xml.rels
    const rels = new Map<string, string>();
    if (relsXml) {
      DocxPackage.parseRelationships(relsXml, rels);
    }

    // 4. Extract media files (word/media/*)
    const media = new Map<string, Uint8Array>();
    for (const [filePath, zipEntry] of Object.entries(zip.files)) {
      if (filePath.startsWith('word/media/') && !zipEntry.dir) {
        const bytes = await zipEntry.async('uint8array');
        // Store relative to word/ (e.g. 'media/image1.png') to match relationship targets
        const relTarget = filePath.slice('word/'.length);
        media.set(relTarget, bytes);
      }
    }

    return new DocxPackage(
      zip,
      {
        documentXml,
        stylesXml,
        numberingXml,
        footnotesXml,
        endnotesXml,
        relsXml,
      },
      rels,
      media
    );
  }

  /**
   * Retrieve any XML part by relative or absolute package path.
   */
  public async getXml(partPath: string): Promise<string | undefined> {
    const normalized = partPath.startsWith('/') ? partPath.slice(1) : partPath;
    const file = this.zip.file(normalized);
    if (!file) return undefined;
    return file.async('text');
  }

  /**
   * Retrieve media file bytes by target path or filename.
   */
  public getMedia(keyOrTarget: string): Uint8Array | undefined {
    if (this.media.has(keyOrTarget)) {
      return this.media.get(keyOrTarget);
    }
    const prefixed = `media/${keyOrTarget}`;
    if (this.media.has(prefixed)) {
      return this.media.get(prefixed);
    }
    const baseName = keyOrTarget.split('/').pop();
    if (baseName && this.media.has(`media/${baseName}`)) {
      return this.media.get(`media/${baseName}`);
    }
    return undefined;
  }

  /**
   * Retrieve media file bytes by relationship ID (e.g. "rId4").
   */
  public getMediaByRId(rId: string): Uint8Array | undefined {
    const target = this.rels.get(rId);
    if (!target) return undefined;
    return this.getMedia(target);
  }

  /**
   * Get relationship target by relationship ID.
   */
  public getRelationship(rId: string): string | undefined {
    return this.rels.get(rId);
  }

  /**
   * Parse relationships XML into a map.
   */
  private static parseRelationships(relsXml: string, rels: Map<string, string>): void {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        isArray: (name) => name === 'Relationship',
      });
      const parsed = parser.parse(relsXml);
      const root = parsed.Relationships || parsed.relationships;
      const relationships = root?.Relationship;
      if (Array.isArray(relationships)) {
        for (const rel of relationships) {
          const id = rel['@_Id'] || rel['@_id'];
          const target = rel['@_Target'] || rel['@_target'];
          if (id && target) {
            rels.set(id, target);
          }
        }
      }
    } catch {
      // Fallback regex in case of malformed relationships XML
      const relMatches = relsXml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/gi);
      for (const match of relMatches) {
        if (match[1] && match[2]) {
          rels.set(match[1], match[2]);
        }
      }
    }
  }
}
