import vnuhcmHsData from './vnuhcm-hs.json';
import { JournalProfile } from '../types';
import { BASE_PROFILE } from './base.profile';
import {
  ALL_JOURNAL_IDS,
  JOURNAL_DEFINITIONS,
  normalizeJournalId,
  JOURNAL_ALIASES,
  JournalId,
} from './journals';
import {
  ALL_ARTICLE_TYPES,
  ARTICLE_TYPE_DEFINITIONS,
  ARTICLE_TYPE_ALIASES,
  normalizeArticleTypeId,
} from './article-types';
import { resolveProfile } from '../resolver/resolve-profile';

export * from './base.profile';
export * from './journals';
export * from './article-types';

export const VNUHCM_HS_PROFILE = vnuhcmHsData as unknown as JournalProfile;

export const STD_PROFILE: JournalProfile = resolveProfile('std');
export const HS_PROFILE: JournalProfile = resolveProfile('hs');
export const SSH_PROFILE: JournalProfile = resolveProfile('ssh');
export const EBL_PROFILE: JournalProfile = resolveProfile('ebl');
export const ET_PROFILE: JournalProfile = resolveProfile('et');
export const EES_PROFILE: JournalProfile = resolveProfile('ees');
export const ARNS_PROFILE: JournalProfile = resolveProfile('arns');

export const ALL_JOURNAL_PROFILES: JournalProfile[] = [
  VNUHCM_HS_PROFILE,
  STD_PROFILE,
  HS_PROFILE,
  SSH_PROFILE,
  EBL_PROFILE,
  ET_PROFILE,
  EES_PROFILE,
  ARNS_PROFILE,
];
