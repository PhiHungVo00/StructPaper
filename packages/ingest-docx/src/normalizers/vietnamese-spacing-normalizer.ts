import type { Manuscript } from '@structpaper/doc-model';
import type { Normalizer } from './types';
import { transformManuscriptInlines } from './tree-utils';

/**
 * Common Vietnamese consonant clusters that might get split into spaced letters.
 */
const CONSONANT_CLUSTERS: [RegExp, string][] = [
  [/(?<!\p{L})n\s+g\s+h(?!\p{L})/gui, 'ngh'],
  [/(?<!\p{L})n\s+g(?!\p{L})/gui, 'ng'],
  [/(?<!\p{L})n\s+h(?!\p{L})/gui, 'nh'],
  [/(?<!\p{L})c\s+h(?!\p{L})/gui, 'ch'],
  [/(?<!\p{L})t\s+h(?!\p{L})/gui, 'th'],
  [/(?<!\p{L})t\s+r(?!\p{L})/gui, 'tr'],
  [/(?<!\p{L})p\s+h(?!\p{L})/gui, 'ph'],
  [/(?<!\p{L})k\s+h(?!\p{L})/gui, 'kh'],
  [/(?<!\p{L})g\s+h(?!\p{L})/gui, 'gh'],
  [/(?<!\p{L})g\s+i(?!\p{L})/gui, 'gi'],
  [/(?<!\p{L})q\s+u(?!\p{L})/gui, 'qu'],
];

/**
 * Common Vietnamese vowel digraphs that might get split into spaced characters.
 */
const VOWEL_CLUSTERS: [RegExp, string][] = [
  [/ư\s+ỡ/gui, 'ưỡ'],
  [/ư\s+ơ/gui, 'ươ'],
  [/ư\s+ờ/gui, 'ườ'],
  [/ư\s+ớ/gui, 'ướ'],
  [/ư\s+ở/gui, 'ưở'],
  [/ư\s+ữ/gui, 'ưữ'],
  [/ư\s+ợ/gui, 'ượ'],
  [/u\s+ô/gui, 'uô'],
  [/u\s+ồ/gui, 'uồ'],
  [/u\s+ố/gui, 'uố'],
  [/u\s+ổ/gui, 'uổ'],
  [/u\s+ỗ/gui, 'uỗ'],
  [/u\s+ộ/gui, 'uộ'],
  [/i\s+ê/gui, 'iê'],
  [/i\s+ề/gui, 'iề'],
  [/i\s+ế/gui, 'iế'],
  [/i\s+ể/gui, 'iể'],
  [/i\s+ễ/gui, 'iễ'],
  [/i\s+ệ/gui, 'iệ'],
  [/y\s+ê/gui, 'yê'],
  [/y\s+ế/gui, 'yế'],
  [/y\s+ề/gui, 'yề'],
  [/y\s+ể/gui, 'yể'],
  [/y\s+ễ/gui, 'yễ'],
  [/y\s+ệ/gui, 'yệ'],
  [/o\s+a/gui, 'oa'],
  [/o\s+ă/gui, 'oă'],
  [/u\s+y/gui, 'uy'],
  [/u\s+y\s+ê/gui, 'uyê'],
  [/u\s+y\s+ế/gui, 'uyế'],
  [/u\s+y\s+ễ/gui, 'uyễ'],
];

/**
 * Consonant fragments that cannot stand alone as words.
 */
const CONSONANT_FRAGMENTS = new Set([
  'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'x',
  'ngh', 'ng', 'nh', 'ch', 'th', 'tr', 'ph', 'kh', 'gh', 'gi', 'qu',
]);

/**
 * Valid single-letter words in Vietnamese and English.
 */
const VALID_STANDALONE_WORDS = new Set([
  'a', 'i', 'ở', 'ổ', 'ý', 'ạ', 'ô', 'ơ', 'ê',
]);

function isFragment(token: string): boolean {
  const lower = token.toLowerCase();
  if (CONSONANT_FRAGMENTS.has(lower)) return true;
  if (lower.length === 1 && !VALID_STANDALONE_WORDS.has(lower)) return true;
  // Two-letter vowel clusters e.g. "ườ", "ưỡ", "iê", "uô"
  if (/^[ưuiyo][àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵaăâeêioôơuưy]$/u.test(lower)) {
    return true;
  }
  return false;
}

/**
 * Repairs broken Vietnamese spacing caused by DOCX font encoding or kerning.
 * E.g.: "Nguy ễ n" -> "Nguyễn", "d ư ỡ ng" -> "dưỡng", "n g h i ệ p" -> "nghiệp".
 */
export function fixVietnameseSpacing(text: string): string {
  if (!text || text.length < 3) return text;

  let result = text;

  // 1. Repair split consonant clusters
  for (const [pattern, replacement] of CONSONANT_CLUSTERS) {
    result = result.replace(pattern, replacement);
  }

  // 2. Repair split vowel clusters
  for (const [pattern, replacement] of VOWEL_CLUSTERS) {
    result = result.replace(pattern, replacement);
  }

  // 3a. Split tone vowel inside a word: e.g. "Nguy ễ n" -> "Nguyễn", "ti ế ng" -> "tiếng", "b ệ nh" -> "bệnh"
  const splitVowelWithSuffixRegex =
    /(?<!\p{L})(\p{L}+)\s+([àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]|ưỡ|ươ|ườ|ướ|ưở|ưữ|ượ|uô|uồ|uố|uổ|uỗ|uộ|iê|iề|iế|iể|iễ|iệ|yê|yế|yề|yể|yễ|yệ|oa|oă|uy|uyê|uyế|uyễ)\s+(\p{L}+)(?!\p{L})/gui;
  result = result.replace(splitVowelWithSuffixRegex, (match, p1, p2, p3) => {
    return `${p1}${p2}${p3}`;
  });

  // 3c. Word ending with a vowel followed by a split terminal consonant (c, ch, m, n, ng, nh, p, t):
  // e.g. "Nguyễ n" -> "Nguyễn", "tiế ng" -> "tiếng", "bệ nh" -> "bệnh", "dưỡ ng" -> "dưỡng"
  const splitTerminalConsonantRegex =
    /(\p{L}*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵaăâeêioôơuưy])\s+(c|ch|m|n|ng|nh|p|t)(?!\p{L})/gui;
  result = result.replace(splitTerminalConsonantRegex, '$1$2');

  // 4. Token-based fragment joining (e.g. "d ưỡ ng" -> "dưỡng", "tr ườ ng" -> "trường", "ngh iệp" -> "nghiệp")
  // Scan whitespace-separated tokens and group contiguous fragment tokens
  const tokens = result.split(/(\s+)/);
  const rebuilt: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    // If not a word token (e.g. whitespace or punctuation), keep as is
    if (/^\s+$/.test(token) || !/^\p{L}+$/u.test(token)) {
      rebuilt.push(token);
      i++;
      continue;
    }

    // Check if this token starts a sequence of fragment tokens
    if (isFragment(token)) {
      let fragmentGroup = token;
      let j = i + 1;
      let matchedCount = 1;

      while (j < tokens.length) {
        const nextSep = tokens[j];
        const nextToken = tokens[j + 1];

        // Only continue if separator is a single space and nextToken is a fragment or short letter
        if (
          nextSep === ' ' &&
          nextToken &&
          /^\p{L}+$/u.test(nextToken) &&
          (isFragment(nextToken) || nextToken.length <= 2)
        ) {
          fragmentGroup += nextToken;
          matchedCount++;
          j += 2;
        } else {
          break;
        }
      }

      if (matchedCount > 1) {
        rebuilt.push(fragmentGroup);
        i = j;
        continue;
      }
    }

    rebuilt.push(token);
    i++;
  }

  return rebuilt.join('');
}

/**
 * Normalizer that repairs split Vietnamese vowels and spaced letters throughout Manuscript text.
 */
export class VietnameseSpacingNormalizer implements Normalizer {
  public readonly name = 'vietnamese-spacing-normalizer';

  public normalize(doc: Manuscript): Manuscript {
    return transformManuscriptInlines(doc, (inlines) =>
      inlines.map((inline) => {
        if (inline.t === 'text') {
          return {
            ...inline,
            v: fixVietnameseSpacing(inline.v),
          };
        }
        return inline;
      })
    );
  }
}

export function normalizeVietnameseSpacing(doc: Manuscript): Manuscript {
  return new VietnameseSpacingNormalizer().normalize(doc);
}
