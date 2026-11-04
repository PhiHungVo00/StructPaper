import vnuhcmHsData from './vnuhcm-hs.json';
import { JournalProfile } from '../types';

export const VNUHCM_HS_PROFILE = vnuhcmHsData as unknown as JournalProfile;

export const ALL_JOURNAL_PROFILES: JournalProfile[] = [
  VNUHCM_HS_PROFILE,
];
