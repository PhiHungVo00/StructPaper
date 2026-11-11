/**
 * Pair figure captions ("Hình N: …") with the picture that sits next to them in the Word XML.
 *
 * The old logic paired by order (image, then the next caption) and fell back to "image number N for
 * figure N". When a figure is a native Word drawing (no picture) or the caption comes *above* the
 * picture, that attached the wrong image to the wrong figure. Here every picture is matched to the
 * nearest caption by position in document.xml, each picture at most once.
 */

const CAPTION_RE = /^\s*(?:h\s*ình|hình|figure|fig\.?)\s*(\d+)\s*[:.]/i;
const MAX_DISTANCE = 8000; // characters of XML between a caption paragraph and its picture

export function parseImageRelationships(relsXml: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/gi)) {
    const tag = m[0];
    const id = tag.match(/\bId="([^"]+)"/)?.[1];
    const target = tag.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target && /\/media\//i.test(target.startsWith('/') ? target : `/${target}`)) {
      map.set(id, target.split('/').pop() as string);
    }
  }
  return map;
}

export interface FigurePairing {
  /** figure number -> media file name (e.g. 2 -> "image1.png"). */
  images: Map<number, string>;
  /** Every figure number whose caption paragraph was found in the XML. */
  captionNumbers: Set<number>;
}

/** figure number -> media file name. Empty when nothing can be paired. */
export function mapFiguresToImages(docXml: string, relsXml: string): Map<number, string> {
  return pairFiguresWithImages(docXml, relsXml).images;
}

export function pairFiguresWithImages(docXml: string, relsXml: string): FigurePairing {
  const rels = parseImageRelationships(relsXml);
  const images: { pos: number; name: string }[] = [];
  for (const m of docXml.matchAll(/<a:blip\b[^>]*\br:embed="([^"]+)"|<v:imagedata\b[^>]*\br:id="([^"]+)"/gi)) {
    const name = rels.get(m[1] || m[2]);
    if (name) images.push({ pos: m.index ?? 0, name });
  }

  const captions: { pos: number; num: number }[] = [];
  for (const p of docXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/gi)) {
    const text = p[0].replace(/<[^>]+>/g, '');
    const num = text.match(CAPTION_RE)?.[1];
    if (num) captions.push({ pos: p.index ?? 0, num: Number(num) });
  }

  const pairs: { d: number; c: number; i: number }[] = [];
  captions.forEach((c, ci) => images.forEach((img, ii) => pairs.push({ d: Math.abs(img.pos - c.pos), c: ci, i: ii })));
  pairs.sort((a, b) => a.d - b.d);

  const usedCaption = new Set<number>();
  const usedImage = new Set<number>();
  const result = new Map<number, string>();
  for (const { d, c, i } of pairs) {
    if (d > MAX_DISTANCE) break;
    if (usedCaption.has(c) || usedImage.has(i)) continue;
    usedCaption.add(c);
    usedImage.add(i);
    result.set(captions[c].num, images[i].name);
  }
  return { images: result, captionNumbers: new Set(captions.map((c) => c.num)) };
}
