import type { JournalProfile } from '@structpaper/journal-profiles';
import { getManagedJournals, ManagedJournalProfile } from './journal-storage';

export interface TemplateValidationResult {
  isDuplicate: boolean;
  duplicateField?: 'vi' | 'en' | 'short' | 'id';
  message?: string;
}

/**
 * Validates that a journal profile does not share duplicate names (Vietnamese, English, Short code, or ID)
 * with any other existing journal profile in the system.
 */
export function validateJournalProfileUniqueness(
  excludeId: string,
  profile: JournalProfile,
  allJournals?: ManagedJournalProfile[]
): TemplateValidationResult {
  const journals = allJournals || getManagedJournals();

  const nameVi = profile.names?.vi?.trim().toLowerCase();
  const nameEn = profile.names?.en?.trim().toLowerCase();
  const nameShort = profile.names?.short?.trim().toLowerCase();
  const profileId = profile.id?.trim().toLowerCase();

  for (const j of journals) {
    if (j.id.toLowerCase() === excludeId.toLowerCase()) continue;

    const jNameVi = j.profile.names?.vi?.trim().toLowerCase();
    const jNameEn = j.profile.names?.en?.trim().toLowerCase();
    const jNameShort = j.profile.names?.short?.trim().toLowerCase();
    const jId = j.id?.trim().toLowerCase();

    if (nameVi && jNameVi && nameVi === jNameVi) {
      return {
        isDuplicate: true,
        duplicateField: 'vi',
        message: `Tên tiếng Việt "${profile.names.vi}" đã được sử dụng bởi mẫu tạp chí "${j.profile.names?.short || j.id}". Vui lòng đặt tên phân biệt.`,
      };
    }

    if (nameEn && jNameEn && nameEn === jNameEn) {
      return {
        isDuplicate: true,
        duplicateField: 'en',
        message: `Tên tiếng Anh "${profile.names.en}" đã được sử dụng bởi mẫu tạp chí "${j.profile.names?.short || j.id}". Vui lòng đặt tên phân biệt.`,
      };
    }

    if (nameShort && jNameShort && nameShort === jNameShort) {
      return {
        isDuplicate: true,
        duplicateField: 'short',
        message: `Mã viết tắt "${profile.names.short}" đã tồn tại trên mẫu tạp chí "${j.profile.names?.vi || j.id}". Quy chuẩn mã tạp chí không được trùng lặp.`,
      };
    }

    if (profileId && jId && profileId === jId) {
      return {
        isDuplicate: true,
        duplicateField: 'id',
        message: `Mã định danh tạp chí "${profile.id}" đã tồn tại trong hệ thống.`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Validates that a custom template name does not conflict with existing custom/built-in templates.
 */
export function validateCustomTemplateUniqueness(
  excludeId: string,
  targetName: string,
  existingTemplates: { id: string; name: string }[] = []
): { isDuplicate: boolean; message?: string } {
  const trimmed = targetName.trim().toLowerCase();
  if (!trimmed) {
    return { isDuplicate: true, message: 'Tên template không được để trống.' };
  }

  for (const t of existingTemplates) {
    if (t.id === excludeId) continue;
    if (t.name.trim().toLowerCase() === trimmed) {
      return {
        isDuplicate: true,
        message: `Tên template "${targetName.trim()}" đã tồn tại trong hệ thống. Vui lòng đặt tên phân biệt để tránh ghi đè.`,
      };
    }
  }

  return { isDuplicate: false };
}
