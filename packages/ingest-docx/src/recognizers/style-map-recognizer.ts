import { RawBlock } from '../types/raw-doc';
import { Claim, IngestContext, Recognizer, SemanticRole } from './types';

function normalizeStyle(style: string): string {
  return style.trim().toLowerCase().replace(/[\s\-_]/g, '');
}

/**
 * StyleMapRecognizer matches paragraph styles against the journal profile's styleMap.
 * Priority 1 (highest priority).
 * Returns claims with confidence 1.0 for matched styles, or ignores template instructions.
 */
export class StyleMapRecognizer implements Recognizer {
  public readonly id = 'style-map';
  public readonly priority = 1;

  public recognize(block: RawBlock, ctx: IngestContext): Claim | null {
    if (block.type !== 'paragraph') {
      return null;
    }

    const { styleMap } = ctx.profile;
    if (!styleMap) {
      return null;
    }

    // Build lookup maps for exact and normalized matches
    const exactMap = new Map<string, { role: SemanticRole; canonicalKey: string }>();
    const normalizedMap = new Map<string, { role: SemanticRole; canonicalKey: string }>();

    for (const [key, roleStr] of Object.entries(styleMap)) {
      const role = roleStr as SemanticRole;
      exactMap.set(key, { role, canonicalKey: key });
      normalizedMap.set(normalizeStyle(key), { role, canonicalKey: key });
    }

    // Collect style candidates in priority order: direct name, direct id, resolved name
    const candidates: string[] = [];
    if (block.styleName) {
      candidates.push(block.styleName);
    }
    if (block.styleId && block.styleId !== block.styleName) {
      candidates.push(block.styleId);
    }
    if (block.styleId && ctx.styleResolver) {
      const resolved = ctx.styleResolver.resolveStyleName(block.styleId);
      if (resolved && !candidates.includes(resolved)) {
        candidates.push(resolved);
      }
    }

    // 1. Direct candidate matching
    for (const cand of candidates) {
      const exactMatch = exactMap.get(cand);
      if (exactMatch) {
        return this.createClaim(exactMatch, block);
      }
      const normMatch = normalizedMap.get(normalizeStyle(cand));
      if (normMatch) {
        return this.createClaim(normMatch, block);
      }
    }

    // 2. Inheritance chain check (walk up w:basedOn)
    if (block.styleId && ctx.styleResolver) {
      const chain = ctx.styleResolver.getInheritanceChain(block.styleId);
      // Skip chain[0] as it was already checked above
      for (let i = 1; i < chain.length; i++) {
        const ancestorId = chain[i];
        const ancestorName = ctx.styleResolver.resolveStyleName(ancestorId);

        const ancestorCandidates = [ancestorId];
        if (ancestorName && ancestorName !== ancestorId) {
          ancestorCandidates.push(ancestorName);
        }

        for (const cand of ancestorCandidates) {
          const exactMatch = exactMap.get(cand);
          if (exactMatch) {
            return this.createClaim(exactMatch, block);
          }
          const normMatch = normalizedMap.get(normalizeStyle(cand));
          if (normMatch) {
            return this.createClaim(normMatch, block);
          }
        }
      }
    }

    // 3. Fallback check for template guidelines / instructions (Guide* or Instruction)
    const anyStyle = block.styleName || block.styleId;
    if (anyStyle && /^(guide|instruction)/i.test(anyStyle)) {
      return {
        role: 'ignore',
        confidence: 1.0,
        evidence: 'styleMap:ignore',
        metadata: {
          styleId: block.styleId,
          styleName: block.styleName,
          matchedStyle: anyStyle,
        },
      };
    }

    return null;
  }

  private createClaim(
    match: { role: SemanticRole; canonicalKey: string },
    block: { styleId?: string; styleName?: string }
  ): Claim {
    const isIgnore = match.role === 'ignore';
    return {
      role: match.role,
      confidence: 1.0,
      evidence: isIgnore ? 'styleMap:ignore' : `styleMap:${match.canonicalKey}`,
      metadata: {
        styleId: block.styleId,
        styleName: block.styleName,
        matchedStyle: match.canonicalKey,
      },
    };
  }
}
