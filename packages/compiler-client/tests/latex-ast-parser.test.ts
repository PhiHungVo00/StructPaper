import { describe, it, expect } from 'vitest';
import { parseLatexToAST } from '../src/wasm/parser/latex-ast-parser';

describe('packages/compiler-client - latex-ast-parser', () => {
  it('extracts metadata: title, authors, abstract, keywords', () => {
    const tex = `
\\documentclass{article}
\\title{Căn tính và không gian văn hóa trong nghiên cứu}
\\author{Nguyễn Văn A\\textsuperscript{1, *}, Trần Thị B\\textsuperscript{2}}
\\begin{document}
\\begin{abstract}
Nghiên cứu này khảo sát các đặc điểm căn tính trong bối cảnh toàn cầu hóa.
\\end{abstract}
\\textbf{Từ khóa:} Căn tính, văn hóa, không gian
\\end{document}
`;

    const ast = parseLatexToAST(tex);
    expect(ast.metadata.title).toContain('Căn tính và không gian');
    expect(ast.metadata.authors.length).toBeGreaterThanOrEqual(1);
    expect(ast.metadata.abstract).toContain('Nghiên cứu này khảo sát');
    expect(ast.metadata.keywords).toContain('Căn tính');
  });

  it('extracts sections, subsections, and paragraphs', () => {
    const tex = `
\\documentclass{article}
\\begin{document}
\\section{1. ĐẶT VẤN ĐỀ}
Căn tính (identity) là một khái niệm đa chiều.
Erik Erikson nhấn mạnh rằng căn tính hình thành thông qua quá trình cam kết [1].

\\subsection{1.1. Bối cảnh nghiên cứu}
Trong bối cảnh di cư và chuyển biến xã hội hiện nay.

\\section{2. PHƯƠNG PHÁP}
Chúng tôi thu thập 100 mẫu tài liệu khảo sát.
\\end{document}
`;

    const ast = parseLatexToAST(tex);
    const headings = ast.blocks.filter((b) => b.type === 'h1');
    expect(headings.length).toBe(2);
    expect(headings[0].title).toBe('1. ĐẶT VẤN ĐỀ');
    expect(headings[1].title).toBe('2. PHƯƠNG PHÁP');

    const subheadings = ast.blocks.filter((b) => b.type === 'h2');
    expect(subheadings.length).toBe(1);
    expect(subheadings[0].title).toBe('1.1. Bối cảnh nghiên cứu');

    const paragraphs = ast.blocks.filter((b) => b.type === 'paragraph');
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);
    expect(paragraphs[0].content).toContain('Căn tính (identity) là một khái niệm');
  });

  it('cleans LaTeX macros properly without losing text', () => {
    const tex = `
\\documentclass{article}
\\begin{document}
Nghiên cứu của \\textit{Nguyễn và cs.} [1] cho thấy tỷ lệ đạt 98\\% (p $<$ 0.05).
Công thức $E = mc^2$ và ký tự đặc biệt \\& dấu ngã~được làm sạch.
\\end{document}
`;

    const ast = parseLatexToAST(tex);
    const paragraphs = ast.blocks.filter((b) => b.type === 'paragraph');
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].content).toContain('Nguyễn và cs.');
    expect(paragraphs[0].content).toContain('98%');
    expect(paragraphs[0].content).toContain('&');
    expect(paragraphs[0].content).not.toContain('\\textit');
  });

  it('parses tables from tabular environment', () => {
    const tex = `
\\documentclass{article}
\\begin{document}
\\begin{table}[htbp]
\\caption{Bảng 1: Thống kê mẫu khảo sát}
\\begin{tabular}{llr}
\\hline
STT & Tiêu chí & Giá trị \\\\
\\hline
1 & Tỷ lệ & 85% \\\\
2 & Số lượng & 120 \\\\
\\hline
\\end{tabular}
\\end{table}
\\end{document}
`;

    const ast = parseLatexToAST(tex);
    const tables = ast.blocks.filter((b) => b.type === 'table');
    expect(tables.length).toBe(1);
    expect(tables[0].table?.caption).toContain('Bảng 1');
    expect(tables[0].table?.headers.length).toBe(3);
    expect(tables[0].table?.rows.length).toBe(2);
  });

  it('parses bibliography references', () => {
    const tex = `
\\documentclass{article}
\\begin{document}
Nội dung bài viết.
\\begin{thebibliography}{99}
\\bibitem{erikson1968} Erikson EH. Identity: Youth and Crisis. New York: Norton; 1968.
\\bibitem{hall1996} Hall S. Questions of Cultural Identity. London: Sage; 1996.
\\end{thebibliography}
\\end{document}
`;

    const ast = parseLatexToAST(tex);
    const refs = ast.blocks.filter((b) => b.type === 'reference');
    expect(refs.length).toBe(2);
    expect(refs[0].reference?.text).toContain('Identity: Youth and Crisis');
    expect(refs[1].reference?.text).toContain('Questions of Cultural Identity');
  });
});
