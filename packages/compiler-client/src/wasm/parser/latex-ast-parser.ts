import type { PaperAST, ASTMetadata, ASTBlock, ASTTable, ASTReference } from './ast-types';

/**
 * Strips common LaTeX inline markup and unescapes TeX entities.
 */
export function cleanLatexText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove TeX comments (lines starting with % or % after whitespace)
  cleaned = cleaned.replace(/(^|[^\\])%.*$/gm, '$1');

  // Replace common TeX escape characters
  cleaned = cleaned
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\_/g, '_')
    .replace(/\\#/g, '#')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}');

  // Replace non-breaking space ~
  cleaned = cleaned.replace(/~/g, ' ');

  // Replace math mode inline tags $...$ with the contents
  cleaned = cleaned.replace(/\$([^$]+)\$/g, '$1');

  // Strip text formatting commands but keep content: \textbf{abc} -> abc, \textit{abc} -> abc
  cleaned = cleaned.replace(/\\(?:textbf|textit|emph|texttt|textsf|textsc|underline|textsuperscript|textsubscript)\{([^}]*)\}/g, '$1');

  // Handle nested or repeat occurrences
  cleaned = cleaned.replace(/\\(?:textbf|textit|emph|texttt|textsf|textsc|underline|textsuperscript|textsubscript)\{([^}]*)\}/g, '$1');

  // Clean cite and ref macros: \cite{xyz} -> [xyz], \ref{xyz} -> xyz
  cleaned = cleaned.replace(/\\cite(?:\[[^\]]*\])?\{([^}]*)\}/g, '[$1]');
  cleaned = cleaned.replace(/\\ref\{([^}]*)\}/g, '$1');

  // Clean line breaks in text
  cleaned = cleaned.replace(/\\\\(?:\s*\[[^\]]*\])?/g, ' ');

  // Remove orphan control sequences: e.g. \par, \noindent, \centering, \raggedright
  cleaned = cleaned.replace(/\\(?:par|noindent|centering|raggedright|raggedleft|clearpage|newpage|bigskip|medskip|smallskip|leavevmode)\b/g, ' ');

  // Normalize spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();

  return cleaned;
}

/**
 * Extracts the contents inside a LaTeX command with curly braces, e.g. \title{...}
 */
function extractCommand(tex: string, commandName: string): string | null {
  const marker = `\\${commandName}{`;
  const idx = tex.indexOf(marker);
  if (idx === -1) return null;

  let braceCount = 1;
  let cursor = idx + marker.length;
  const start = cursor;

  while (cursor < tex.length && braceCount > 0) {
    if (tex[cursor] === '{' && tex[cursor - 1] !== '\\') {
      braceCount++;
    } else if (tex[cursor] === '}' && tex[cursor - 1] !== '\\') {
      braceCount--;
    }
    cursor++;
  }

  if (braceCount === 0) {
    return tex.substring(start, cursor - 1).trim();
  }
  return null;
}

/**
 * Extracts content inside an environment: \begin{envName} ... \end{envName}
 */
function extractEnvironment(tex: string, envName: string): string | null {
  const beginMarker = `\\begin{${envName}}`;
  const endMarker = `\\end{${envName}}`;
  const startIdx = tex.indexOf(beginMarker);
  if (startIdx === -1) return null;

  const contentStart = startIdx + beginMarker.length;
  const endIdx = tex.indexOf(endMarker, contentStart);
  if (endIdx === -1) return null;

  return tex.substring(contentStart, endIdx).trim();
}

/**
 * Parses tabular content into rows and headers
 */
function parseTabular(tableContent: string): ASTTable {
  const tabularInner = extractEnvironment(tableContent, 'tabular') || '';
  const rawLines = tabularInner
    .replace(/\\(?:hline|toprule|midrule|bottomrule)/g, '')
    .split('\\\\')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.includes('&'));

  const rawRows: string[][] = [];
  for (const line of rawLines) {
    const cells = line.split('&').map((c) => cleanLatexText(c));
    if (cells.some((c) => c.length > 0)) {
      rawRows.push(cells);
    }
  }

  const headers = rawRows.length > 0 ? rawRows[0] : [];
  const rows = rawRows.length > 1 ? rawRows.slice(1) : [];

  const caption = extractCommand(tableContent, 'caption');

  return {
    caption: caption ? cleanLatexText(caption) : undefined,
    headers,
    rows,
  };
}

/**
 * Parses bibliography items: \bibitem{id} text
 */
function parseBibliography(bibContent: string): ASTReference[] {
  const items = bibContent.split('\\bibitem').filter((s) => s.trim().length > 0);
  const refs: ASTReference[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const match = item.match(/^(?:\[([^\]]*)\])?\{([^}]+)\}([\s\S]*)$/);
    if (match) {
      const id = match[2].trim();
      const text = cleanLatexText(match[3]);
      refs.push({
        id,
        num: i + 1,
        text,
      });
    } else {
      const text = cleanLatexText(item);
      if (text) {
        refs.push({
          id: `ref-${i + 1}`,
          num: i + 1,
          text,
        });
      }
    }
  }

  return refs;
}

/**
 * Main parser entry point: parses full LaTeX source into PaperAST.
 */
export function parseLatexToAST(tex: string): PaperAST {
  // 1. Extract metadata
  const rawTitle = extractCommand(tex, 'title') || '';
  const title = cleanLatexText(rawTitle);

  const rawAuthor = extractCommand(tex, 'author') || '';
  const cleanedAuthor = cleanLatexText(rawAuthor);
  const authors = cleanedAuthor
    ? cleanedAuthor.split(/[,;\n]+/).map((a) => a.trim()).filter(Boolean)
    : [];

  const rawAbstract =
    extractEnvironment(tex, 'abstract') ||
    extractEnvironment(tex, 'onecolabstract') ||
    '';
  const abstract = cleanLatexText(rawAbstract);

  // Extract keywords
  const keywordsMatch = tex.match(/(?:\\textbf\{Từ khóa:?\}|\\textbf\{Keywords:?\})([^\n\\%]+)/i);
  let keywords: string[] = [];
  if (keywordsMatch && keywordsMatch[1]) {
    keywords = keywordsMatch[1]
      .split(/[,;]+/)
      .map((k) => cleanLatexText(k))
      .filter((k) => k.length > 0);
  }

  const metadata: ASTMetadata = {
    title: title || 'Bản Thảo Bài Báo Khoa Học',
    authors: authors.length > 0 ? authors : ['Tác giả'],
    affiliations: [],
    abstract,
    keywords,
    journalName: 'Tạp chí Khoa học và Công nghệ',
  };

  // 2. Extract Document Body
  const docBody = extractEnvironment(tex, 'document') || tex;
  const blocks: ASTBlock[] = [];
  let blockCounter = 1;

  // Split document into lines and detect environments & sections
  const lines = docBody.split('\n');
  let currentParagraphLines: string[] = [];
  let inTable = false;
  let tableAccumulator: string[] = [];
  let inBibliography = false;
  let bibAccumulator: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length === 0) return;
    const text = cleanLatexText(currentParagraphLines.join(' '));
    currentParagraphLines = [];
    if (text.length > 0) {
      blocks.push({
        id: `blk_${blockCounter++}`,
        type: 'paragraph',
        content: text,
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check bibliography
    if (trimmed.includes('\\begin{thebibliography}')) {
      flushParagraph();
      inBibliography = true;
      bibAccumulator = [];
      continue;
    }
    if (inBibliography) {
      if (trimmed.includes('\\end{thebibliography}')) {
        inBibliography = false;
        const refs = parseBibliography(bibAccumulator.join('\n'));
        for (const ref of refs) {
          blocks.push({
            id: `blk_${blockCounter++}`,
            type: 'reference',
            reference: ref,
          });
        }
        bibAccumulator = [];
      } else {
        bibAccumulator.push(rawLine);
      }
      continue;
    }

    // Check table
    if (trimmed.includes('\\begin{table}')) {
      flushParagraph();
      inTable = true;
      tableAccumulator = [rawLine];
      continue;
    }
    if (inTable) {
      tableAccumulator.push(rawLine);
      if (trimmed.includes('\\end{table}')) {
        inTable = false;
        const parsedTable = parseTabular(tableAccumulator.join('\n'));
        blocks.push({
          id: `blk_${blockCounter++}`,
          type: 'table',
          table: parsedTable,
        });
        tableAccumulator = [];
      }
      continue;
    }

    // Check headings
    const secMatch = trimmed.match(/^\\section\*?\{([^}]+)\}/);
    if (secMatch) {
      flushParagraph();
      blocks.push({
        id: `blk_${blockCounter++}`,
        type: 'h1',
        title: cleanLatexText(secMatch[1]),
      });
      continue;
    }

    const subsecMatch = trimmed.match(/^\\subsection\*?\{([^}]+)\}/);
    if (subsecMatch) {
      flushParagraph();
      blocks.push({
        id: `blk_${blockCounter++}`,
        type: 'h2',
        title: cleanLatexText(subsecMatch[1]),
      });
      continue;
    }

    const subsubsecMatch = trimmed.match(/^\\subsubsection\*?\{([^}]+)\}/);
    if (subsubsecMatch) {
      flushParagraph();
      blocks.push({
        id: `blk_${blockCounter++}`,
        type: 'h3',
        title: cleanLatexText(subsubsecMatch[1]),
      });
      continue;
    }

    // Ignore preamble commands appearing inside body
    if (
      trimmed.startsWith('\\maketitle') ||
      trimmed.startsWith('\\date') ||
      trimmed.startsWith('\\begin{abstract}') ||
      trimmed.startsWith('\\end{abstract}') ||
      trimmed.startsWith('\\begin{onecolabstract}') ||
      trimmed.startsWith('\\end{onecolabstract}') ||
      trimmed.startsWith('\\documentclass') ||
      trimmed.startsWith('\\usepackage')
    ) {
      continue;
    }

    // Empty lines trigger paragraph break
    if (trimmed.length === 0) {
      flushParagraph();
      continue;
    }

    // Add line to current paragraph
    currentParagraphLines.push(rawLine);
  }

  flushParagraph();

  return {
    metadata,
    blocks,
  };
}
