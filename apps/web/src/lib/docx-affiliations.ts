import type { Affiliation } from '@/types/paper';

/**
 * Word files often list each affiliation twice, Vietnamese then English. The importer reads them
 * as two affiliations with the same number; the journal prints the Vietnamese one on the Vietnamese
 * page and the English one on the closing English summary page, so fold the second into `nameEn`.
 */
const VI_DIACRITICS = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const EN_HINT = /\b(faculty|department|university|institute|school|college|center|centre|vietnam|hospital)\b/i;

export function looksEnglish(text: string): boolean {
  return !VI_DIACRITICS.test(text) && EN_HINT.test(text);
}

export function mergeBilingualAffiliations(affiliations: Affiliation[]): Affiliation[] {
  const out: Affiliation[] = [];
  for (const aff of affiliations) {
    // an English line belongs to the earlier Vietnamese line carrying the same number
    const target = looksEnglish(aff.name)
      ? out.find((o) => o.id === aff.id && !o.nameEn && !looksEnglish(o.name))
      : undefined;
    if (target) {
      target.nameEn = aff.name;
      continue;
    }
    out.push({ ...aff });
  }
  return out;
}
