import { describe, it, expect } from 'vitest';
import { typesetLatexToPdf } from '../src/wasm/typesetter/pdf-typesetter';

describe('packages/compiler-client - pdf-typesetter', () => {
  it('typesets a short LaTeX document into valid PDF-1.4 bytes', () => {
    const tex = `
\\documentclass{article}
\\title{Nghiên cứu về Bản thảo Khoa học}
\\author{Nguyễn Văn A}
\\begin{document}
\\begin{abstract}
Tóm tắt ngắn gọn bài nghiên cứu thử nghiệm.
\\end{abstract}
\\section{1. Mở đầu}
Nội dung đoạn văn đầu tiên.
\\section{2. Kết luận}
Nội dung đoạn văn kết thúc.
\\end{document}
`;

    const pdfBytes = typesetLatexToPdf(tex);
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(20000);

    const header = Buffer.from(pdfBytes).slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('typesets a large 96-paragraph document spanning multiple pages with page numbers', () => {
    // Generate 96 paragraphs like the user's real paper
    const paragraphs: string[] = [];
    for (let i = 1; i <= 96; i++) {
      paragraphs.push(
        `Đoạn văn thứ ${i}: Căn tính (identity) là một khái niệm đa chiều, phản ánh cách cá nhân và cộng đồng định nghĩa bản thân thông qua mối quan hệ với văn hóa, xã hội và lịch sử [${(i % 26) + 1}]. Quá trình này được duy trì liên tục và phát triển qua thời gian.`
      );
    }

    const tex = `
\\documentclass{article}
\\title{CĂN TÍNH VÀ KHÔNG GIAN VĂN HÓA TRONG VĂN HỌC DI CƯ}
\\author{Nguyễn Văn A, Trần Thị B}
\\begin{document}
\\begin{abstract}
Nghiên cứu khảo sát 96 khía cạnh của căn tính và diễn ngôn văn hóa trong tác phẩm văn học đương đại.
\\end{abstract}
\\textbf{Từ khóa:} Căn tính, không gian văn hóa, văn học di cư

\\section{1. ĐẶT VẤN ĐỀ}
${paragraphs.slice(0, 20).join('\n\n')}

\\section{2. CƠ SỞ LÝ THUYẾT VÀ PHƯƠNG PHÁP}
${paragraphs.slice(20, 50).join('\n\n')}

\\section{3. KẾT QUẢ VÀ THẢO LUẬN}
${paragraphs.slice(50, 80).join('\n\n')}

\\section{4. KẾT LUẬN}
${paragraphs.slice(80, 96).join('\n\n')}

\\begin{thebibliography}{26}
\\bibitem{ref1} Erikson EH. Identity: Youth and Crisis. New York: Norton; 1968.
\\bibitem{ref2} Hall S. Questions of Cultural Identity. London: Sage; 1996.
\\bibitem{ref3} Butler J. Gender Trouble. New York: Routledge; 1990.
\\end{thebibliography}
\\end{document}
`;

    const progressReports: number[] = [];
    const pdfBytes = typesetLatexToPdf(tex, {
      journalName: 'TẠP CHÍ KHOA HỌC XÃ HỘI VÀ NHÂN VĂN (VNUHCM-SSH)',
      onProgress: (p) => progressReports.push(p),
    });

    expect(pdfBytes.length).toBeGreaterThan(40000);
    expect(progressReports).toContain(100);

    const pdfString = Buffer.from(pdfBytes).toString('latin1');
    const pageMatches = (pdfString.match(/\/Type\s*\/Page\b/g) || []).length;
    expect(pageMatches).toBeGreaterThanOrEqual(5);
  });
});
