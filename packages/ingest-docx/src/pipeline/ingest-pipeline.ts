import {
  Manuscript,
  ManuscriptSchema,
  migrateV1toV2,
  type IdGenerator,
} from '@structpaper/doc-model';
import {
  JournalProfile,
  VNUHCM_HS_PROFILE,
  getJournalProfile,
} from '@structpaper/journal-profiles';
import { DocxPackage } from '../package/docx-package';
import { RawDocVisitor } from '../ooxml/raw-doc-visitor';
import { StyleResolver } from '../ooxml/style-resolver';
import { RecognizerChain } from '../recognizers/recognizer-chain';
import { DocAssembler } from '../assemblers/doc-assembler';
import type { RecognizedBlock } from '../assemblers/types';
import { runNormalizers } from '../normalizers';
import {
  calculateConfidence,
  IngestConfidenceScores,
} from './confidence';

export type LegacyDocxParser = (
  buffer: ArrayBuffer | Uint8Array,
  fileName?: string
) => Promise<unknown>;

let globalLegacyParser: LegacyDocxParser | undefined;

/**
 * Registers a global fallback parser (e.g. legacy docx-parser) to be invoked
 * when primary extraction confidence is below threshold.
 */
export function registerLegacyFallbackParser(parser: LegacyDocxParser): void {
  globalLegacyParser = parser;
}

export interface IngestOptions {
  journalId?: string;
  articleType?: string;
  fallbackLegacy?: boolean;
  legacyParser?: LegacyDocxParser;
  fileName?: string;
  minConfidenceThreshold?: number; // default: 0.85
  profile?: JournalProfile;
  idGenerator?: IdGenerator;
}

export interface IngestReport {
  success: boolean;
  confidence: IngestConfidenceScores;
  usedFallback: boolean;
  fallbackReason?: string;
  errors: string[];
  warnings: string[];
  stats: {
    sectionsCount: number;
    tablesCount: number;
    figuresCount: number;
    referencesCount: number;
    authorsCount: number;
    affiliationsCount: number;
  };
  durationMs: number;
}

export interface IngestPipelineResult {
  manuscript: Manuscript;
  report: IngestReport;
}

const VIETNAMESE_DIACRITICS_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỵỷỹđ]/i;

function detectLanguage(meta: Manuscript['meta']): 'vi' | 'en' {
  const titleText = meta.title
    .filter((inline) => inline.t === 'text')
    .map((inline: any) => inline.v)
    .join(' ');

  if (VIETNAMESE_DIACRITICS_REGEX.test(titleText)) return 'vi';

  const abstractText = meta.abstract
    .flat()
    .filter((inline) => inline.t === 'text')
    .map((inline: any) => inline.v)
    .join(' ');

  if (VIETNAMESE_DIACRITICS_REGEX.test(abstractText)) return 'vi';

  return 'en';
}

function computeStats(doc: Manuscript) {
  let tablesCount = 0;
  let figuresCount = 0;

  function countBlocks(blocks: any[]) {
    for (const b of blocks) {
      if (b.type === 'table') tablesCount++;
      if (b.type === 'figure') figuresCount++;
      if (b.type === 'box' && b.content) countBlocks(b.content);
    }
  }

  function walkSections(sections: any[]) {
    for (const sec of sections) {
      countBlocks(sec.blocks);
      if (sec.children) walkSections(sec.children);
    }
  }

  walkSections(doc.body);

  return {
    sectionsCount: doc.body.length,
    tablesCount,
    figuresCount,
    referencesCount: doc.references.length,
    authorsCount: doc.meta.authors.length,
    affiliationsCount: doc.meta.affiliations.length,
  };
}

/**
 * IngestPipeline coordinates the end-to-end ingestion of DOCX documents into
 * normalized, schema-valid Manuscript v2 structures.
 */
export class IngestPipeline {
  /**
   * Executes the full DOCX ingestion pipeline.
   */
  public async ingest(
    docxBuffer: ArrayBuffer | Uint8Array,
    options: IngestOptions = {}
  ): Promise<IngestPipelineResult> {
    const startTime = Date.now();
    const minThreshold = options.minConfidenceThreshold ?? 0.85;
    const errors: string[] = [];
    const warnings: string[] = [];
    let usedFallback = false;
    let fallbackReason: string | undefined;

    // Resolve Journal Profile
    let profile = options.profile;
    if (!profile) {
      if (options.journalId) {
        try {
          profile = getJournalProfile(options.journalId);
        } catch {
          profile = VNUHCM_HS_PROFILE;
        }
      } else {
        profile = VNUHCM_HS_PROFILE;
      }
    }

    let manuscript: Manuscript | null = null;
    let confidence: IngestConfidenceScores = {
      overall: 0,
      title: 0,
      authors: 0,
      sections: 0,
      tables: 0,
    };

    try {
      // 1. Package extraction
      const pkg = await DocxPackage.load(docxBuffer);

      // 2. OOXML parsing
      const visitor = new RawDocVisitor();
      const rawDoc = visitor.visit(pkg);

      // 3. Style recognition
      const chain = new RecognizerChain();
      const styleResolver = new StyleResolver(pkg.stylesXml);
      const claims = chain.recognizeAll(rawDoc.blocks, {
        profile,
        docxPackage: pkg,
        styleResolver,
      });

      const recognizedBlocks: RecognizedBlock[] = rawDoc.blocks.map((block, idx) => ({
        raw: block,
        claim: claims[idx],
        id: `block-${idx + 1}`,
      }));

      // 4. Document Assembly
      const assembler = new DocAssembler();
      const assembled = assembler.assemble(recognizedBlocks, { docxPackage: pkg });

      const lang = detectLanguage(assembled.meta);
      const docId = options.idGenerator
        ? options.idGenerator.nextId('doc')
        : 'doc-1';

      manuscript = {
        schemaVersion: 2,
        id: docId,
        lang,
        journalId: options.journalId || profile.id || 'vnuhcm-hs',
        articleType: options.articleType || 'research-article',
        meta: assembled.meta,
        body: assembled.body,
        back: assembled.back,
        references: assembled.references,
        assets: assembled.assets,
      };

      // 5. Normalization
      manuscript = runNormalizers(manuscript);

      // 6. Calculate Confidence
      confidence = calculateConfidence(manuscript, rawDoc, claims);

      // 7. Zod validation
      const parseCheck = ManuscriptSchema.safeParse(manuscript);
      if (!parseCheck.success) {
        warnings.push(`Validation warning: ${parseCheck.error.message}`);
      }
    } catch (err: any) {
      errors.push(`Primary ingestion failed: ${err?.message || String(err)}`);
    }

    // 8. Fallback Check: if confidence < 0.85 or extraction failed
    const needsFallback =
      !manuscript ||
      confidence.overall < minThreshold ||
      errors.length > 0;

    if (needsFallback && options.fallbackLegacy !== false) {
      const fallbackParser = options.legacyParser || globalLegacyParser;
      if (fallbackParser) {
        try {
          const legacyV1 = await fallbackParser(docxBuffer, options.fileName);
          const migrated = migrateV1toV2(legacyV1, options.idGenerator);
          manuscript = runNormalizers(migrated);
          usedFallback = true;
          fallbackReason =
            confidence.overall < minThreshold
              ? `Confidence score ${confidence.overall} < ${minThreshold}`
              : errors.join('; ');
          // Clear fatal errors since fallback succeeded
          errors.length = 0;
          confidence = calculateConfidence(manuscript);
        } catch (fbErr: any) {
          errors.push(`Fallback parser failed: ${fbErr?.message || String(fbErr)}`);
        }
      } else if (confidence.overall < minThreshold) {
        warnings.push(
          `Confidence score ${confidence.overall} is below threshold ${minThreshold}, but no fallback parser is registered.`
        );
      }
    }

    if (!manuscript) {
      throw new Error(`IngestPipeline failed completely: ${errors.join(', ')}`);
    }

    const durationMs = Date.now() - startTime;
    const stats = computeStats(manuscript);

    const report: IngestReport = {
      success: errors.length === 0,
      confidence,
      usedFallback,
      fallbackReason,
      errors,
      warnings,
      stats,
      durationMs,
    };

    return { manuscript, report };
  }
}
