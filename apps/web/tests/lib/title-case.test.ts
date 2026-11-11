import { describe, it, expect } from 'vitest';
import { isAllCaps, toSentenceCase, collectAcronyms, normalizeImportedTitle } from '@/lib/title-case';
import { validateForImport } from '@/lib/validation/validators';
import { createEmptyPaper } from '@/types/paper';

describe('title sentence case', () => {
  it('detects all-caps titles only when long enough', () => {
    expect(isAllCaps('ẢNH HƯỞNG CỦA NĂNG LỰC SỐ')).toBe(true);
    expect(isAllCaps('Ảnh hưởng của năng lực số')).toBe(false);
    expect(isAllCaps('PLS-SEM')).toBe(false); // too short to be a "shouted" title
  });

  it('converts to sentence case (first letter capital, rest lower) like the printed journal', () => {
    expect(
      toSentenceCase('ẢNH HƯỞNG CỦA NĂNG LỰC VÀ SÁNG TẠO SỐ ĐẾN HIỆU QUẢ KINH DOANH LOGISTICS CẢM NHẬN: VAI TRÒ CỦA CHUYỂN ĐỔI SỐ')
    ).toBe('Ảnh hưởng của năng lực và sáng tạo số đến hiệu quả kinh doanh logistics cảm nhận: vai trò của chuyển đổi số');
  });

  it('keeps acronyms that appear in capitals elsewhere in the paper', () => {
    const t = 'ỨNG DỤNG MÔ HÌNH PLS-SEM TẠI TPHCM VÀ CNS TRONG LOGISTICS';
    const out = toSentenceCase(t, ['Sử dụng PLS-SEM với SmartPLS tại TPHCM.', 'từ khóa: CNS']);
    expect(out).toBe('Ứng dụng mô hình PLS-SEM tại TPHCM và CNS trong logistics');
  });

  it('collects acronyms from text', () => {
    expect([...collectAcronyms(['dùng PLS-SEM và HQKD, TP.HCM', 'a B'])].sort()).toEqual(['HQKD', 'PLS-SEM', 'TP.HCM'].sort());
  });

  it('normalize keeps the original for undo, and leaves normal titles alone', () => {
    const n = normalizeImportedTitle('ẢNH HƯỞNG CỦA NĂNG LỰC SỐ ĐẾN KẾT QUẢ');
    expect(n.title).toBe('Ảnh hưởng của năng lực số đến kết quả');
    expect(n.original).toBe('ẢNH HƯỞNG CỦA NĂNG LỰC SỐ ĐẾN KẾT QUẢ');
    expect(normalizeImportedTitle('Đã đúng kiểu câu rồi nhé').original).toBeUndefined();
  });

  it('the import gate reports the conversion as information', () => {
    const p = createEmptyPaper();
    p.metadata.title = 'Ảnh hưởng của năng lực số';
    p.metadata.titleOriginal = 'ẢNH HƯỞNG CỦA NĂNG LỰC SỐ';
    p.sections = [{ id: 'a', type: 'paragraph', content: 'x' }];
    const issue = validateForImport(p).issues.find((i) => i.code === 'field.title.normalized');
    expect(issue?.severity).toBe('info');
  });
});
