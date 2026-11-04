import { JournalTemplate } from '@/types/paper';

/**
 * Official VNUHCM Journal Profiles and Precise Brand Colors
 * Extracted and calibrated directly against the production publication sample PDFs in:
 * "Yêu cầu phần mềm, Template, các file mẫu của Tạp chí"
 */
export const JOURNAL_TEMPLATES: Record<string, JournalTemplate> = {
  'VNUHCM-HS': {
    id: 'VNUHCM-HS',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Health Sciences',
    shortName: 'Sci. Tech. Dev. J. - Health Sci.',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#2B74B7', // Official Journal Blue RGB(43, 116, 183) - Verified in HS 722.pdf
    accentColor: '#E65100', // Burnt orange accent
    issn: '2734-9276',
    eIssn: '2734-9276',
    headerText: 'Tạp chí Phát triển Khoa học và Công nghệ – Health Sciences',
  },
  'VNUHCM-STD': {
    id: 'VNUHCM-STD',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Tự nhiên & Đời sống',
    shortName: 'Sci. Tech. Dev. J.',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#000099', // Official Deep Blue RGB(0, 0, 153) - Verified in 4581+PUBLISHED (1).pdf
    accentColor: '#00245F',
    issn: '1859-0128',
    eIssn: '2588-1469',
    headerText: 'Science & Technology Development Journal',
  },
  'VNUHCM-STDJ': {
    id: 'VNUHCM-STDJ',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Tự nhiên & Đời sống',
    shortName: 'Sci. Tech. Dev. J.',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#000099', // Official Deep Blue RGB(0, 0, 153)
    accentColor: '#00245F',
    issn: '1859-0128',
    eIssn: '2588-1469',
    headerText: 'Science & Technology Development Journal',
  },
  'VNUHCM-SSH': {
    id: 'VNUHCM-SSH',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Khoa học Xã hội & Nhân văn',
    shortName: 'Sci. Tech. Dev. J. - Soc. Sci. Hum.',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#0000FF', // Official Cobalt Royal Blue RGB(0, 0, 255) - Verified in 1102+PDF.pdf
    accentColor: '#00245F',
    issn: '2588-1043',
    headerText: 'Tạp chí Phát triển KH&CN – Khoa học Xã hội & Nhân văn',
  },
  'VNUHCM-EBL': {
    id: 'VNUHCM-EBL',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Kinh tế, Luật & Quản lý',
    shortName: 'Sci. Tech. Dev. J. - Econ. Bus. Law',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#8F0B97', // Official Magenta/Purple RGB(143, 11, 151) - Verified in EBL ID1750.pdf
    accentColor: '#BA68C8',
    issn: '2588-1108',
    headerText: 'Tạp chí Phát triển KH&CN – Kinh tế, Luật & Quản lý',
  },
  'VNUHCM-ET': {
    id: 'VNUHCM-ET',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Kỹ thuật & Công nghệ',
    shortName: 'Sci. Tech. Dev. J. - Eng. Tech.',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#0F4761', // Official Steel Blue/Dark Slate RGB(15, 71, 97) - Verified in ET ID1563.pdf
    accentColor: '#F8AB60',
    issn: '2588-1205',
    headerText: 'Tạp chí Phát triển KH&CN – Kỹ thuật & Công nghệ',
  },
  'VNUHCM-EES': {
    id: 'VNUHCM-EES',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Môi trường & Khoa học Trái đất',
    shortName: 'Sci. Tech. Dev. J. - Env. Earth Sci.',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#0C712F', // Official Forest Green RGB(12, 113, 47) - Verified in EES+ID850+(1).pdf
    accentColor: '#00803F',
    issn: '2588-1329',
    headerText: 'Tạp chí Phát triển KH&CN – Môi trường & Khoa học Trái đất',
  },
  'VNUHCM-ARNS': {
    id: 'VNUHCM-ARNS',
    name: 'Tạp chí Phát triển Khoa học & Công nghệ – Nghiên cứu Tự nhiên Nâng cao',
    shortName: 'Sci. Tech. Dev. J. - Nat. Sci.',
    publisher: 'ĐHQG TP.HCM / VNU-HCM Press',
    color: '#FF0000', // Official Natural Sciences Red RGB(255, 0, 0) - Verified in 1421 NS PDF.pdf
    accentColor: '#D32F2F',
    issn: '2588-140X',
    headerText: 'Tạp chí Phát triển KH&CN – Natural Sciences',
  },
};

export function getJournalTemplate(journalId?: string): JournalTemplate {
  if (journalId && JOURNAL_TEMPLATES[journalId]) {
    return JOURNAL_TEMPLATES[journalId];
  }
  // Try normalizations (e.g. VNUHCM-STD <-> VNUHCM-STDJ)
  if (journalId === 'VNUHCM-STD') return JOURNAL_TEMPLATES['VNUHCM-STD'];
  if (journalId === 'VNUHCM-STDJ') return JOURNAL_TEMPLATES['VNUHCM-STDJ'];
  return JOURNAL_TEMPLATES['VNUHCM-HS'];
}
