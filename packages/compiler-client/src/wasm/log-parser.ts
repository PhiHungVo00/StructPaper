import type {
  CompileReport,
  CompileReportIssue,
} from '../interfaces/compiler-port';

/**
 * Builds a 1-indexed line-to-blockId lookup map from LaTeX source comments:
 * %% BLOCK: <blockId> or %%BLOCK:<blockId>
 */
function buildBlockMap(texSource?: string): Map<number, string> {
  const map = new Map<number, string>();
  if (!texSource) return map;

  const lines = texSource.split(/\r?\n/);
  let currentBlockId: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const match = lines[i].match(/%% ?BLOCK:\s*([a-zA-Z0-9_-]+)/);
    if (match) {
      currentBlockId = match[1].trim();
    }
    if (currentBlockId) {
      map.set(lineNum, currentBlockId);
    }
  }

  return map;
}

/**
 * Parses raw LaTeX compiler output logs (XeLaTeX, pdfLaTeX, Tectonic, WASM)
 * into a structured CompileReport diagnostic object.
 *
 * @param rawLog Raw log text or array of log line strings.
 * @param texSource Optional original LaTeX source to map issue line numbers to document blockIds.
 */
export function parseLatexLog(
  rawLog: string | string[],
  texSource?: string
): CompileReport {
  const logText = Array.isArray(rawLog) ? rawLog.join('\n') : rawLog || '';
  const lines = logText.split(/\r?\n/);

  const errors: CompileReportIssue[] = [];
  const warnings: CompileReportIssue[] = [];
  let overfullHbox = 0;
  let underfullHbox = 0;

  const missingFontsSet = new Set<string>();
  const missingRefsSet = new Set<string>();
  const missingPackagesSet = new Set<string>();
  const missingImagesSet = new Set<string>();

  const blockMap = buildBlockMap(texSource);

  let currentError: CompileReportIssue | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Detect start of a TeX Error (starts with "!")
    if (line.startsWith('!')) {
      if (currentError) {
        errors.push(currentError);
      }

      currentError = {
        message: trimmed,
        severity: 'error',
      };

      // Check for missing file error (! LaTeX Error: File `xyz' not found.)
      const missingFileMatch = trimmed.match(/File [`']([^'`]+)['`] not found/i);
      if (missingFileMatch) {
        const fileName = missingFileMatch[1];
        if (fileName.endsWith('.sty') || fileName.endsWith('.cls')) {
          missingPackagesSet.add(fileName);
        } else if (/\.(png|jpe?g|pdf|eps|svg)$/i.test(fileName)) {
          missingImagesSet.add(fileName);
        } else {
          missingPackagesSet.add(fileName);
        }
      }

      // Check for font loading error
      const fontMatch = trimmed.match(/Font [^\s=]+=([^\s]+) at .* not loadable/);
      if (fontMatch) {
        // Strip path/prefix if needed
        const fontName = fontMatch[1].replace(/.*\/([^\/]+)$/, '$1').replace(/\(0\).*/, '');
        missingFontsSet.add(fontName);
      }

      continue;
    }

    // 2. Line number indicator under an active error: "l.42 \cmd"
    if (currentError && !currentError.line) {
      const lineMatch = line.match(/^l\.(\d+)/);
      if (lineMatch) {
        const lineNum = parseInt(lineMatch[1], 10);
        currentError.line = lineNum;
        if (blockMap.has(lineNum)) {
          currentError.blockId = blockMap.get(lineNum);
        }
      }
    }

    // End of error block (empty line or delimiter)
    if (currentError && trimmed === '') {
      errors.push(currentError);
      currentError = null;
    }

    // 3. Fontspec errors: "Package fontspec Error: The font "XYZ" cannot be found."
    const fontspecMatch = line.match(/Package fontspec Error: The font "([^"]+)" cannot be found/i);
    if (fontspecMatch) {
      missingFontsSet.add(fontspecMatch[1]);
    }

    // 4. Pdftex missing image: "Package pdftex.def Error: File 'image.png' not found"
    const pdftexImgMatch = line.match(/Package pdftex\.def Error: File [`']([^'`]+)['`] not found/i);
    if (pdftexImgMatch) {
      missingImagesSet.add(pdftexImgMatch[1]);
    }

    // 5. Overfull / Underfull \hbox & \vbox
    if (line.includes('Overfull \\hbox')) {
      overfullHbox++;
      const warnIssue: CompileReportIssue = {
        message: trimmed,
        severity: 'warning',
      };
      const lineRange = line.match(/at lines (\d+)--(\d+)/);
      if (lineRange) {
        warnIssue.line = parseInt(lineRange[1], 10);
        if (blockMap.has(warnIssue.line)) {
          warnIssue.blockId = blockMap.get(warnIssue.line);
        }
      }
      warnings.push(warnIssue);
    } else if (line.includes('Underfull \\hbox')) {
      underfullHbox++;
      const warnIssue: CompileReportIssue = {
        message: trimmed,
        severity: 'warning',
      };
      const lineRange = line.match(/at lines (\d+)--(\d+)/);
      if (lineRange) {
        warnIssue.line = parseInt(lineRange[1], 10);
        if (blockMap.has(warnIssue.line)) {
          warnIssue.blockId = blockMap.get(warnIssue.line);
        }
      }
      warnings.push(warnIssue);
    } else if (line.includes('Overfull \\vbox')) {
      warnings.push({
        message: trimmed,
        severity: 'warning',
      });
    }

    // 6. LaTeX Warnings: References & Citations
    if (line.includes('LaTeX Warning:') || line.includes('Warning:')) {
      const refMatch = line.match(/Reference [`']([^'`]+)['`] on page \d+ undefined on input line (\d+)/i);
      const citeMatch = line.match(/Citation [`']([^'`]+)['`] on page \d+ undefined on input line (\d+)/i);

      if (refMatch) {
        missingRefsSet.add(refMatch[1]);
        const lineNum = parseInt(refMatch[2], 10);
        warnings.push({
          line: lineNum,
          blockId: blockMap.get(lineNum),
          message: trimmed,
          severity: 'warning',
        });
      } else if (citeMatch) {
        missingRefsSet.add(citeMatch[1]);
        const lineNum = parseInt(citeMatch[2], 10);
        warnings.push({
          line: lineNum,
          blockId: blockMap.get(lineNum),
          message: trimmed,
          severity: 'warning',
        });
      } else if (!line.includes('Overfull') && !line.includes('Underfull')) {
        warnings.push({
          message: trimmed,
          severity: 'warning',
        });
      }
    }
  }

  // Push any pending dangling error
  if (currentError) {
    errors.push(currentError);
  }

  return {
    errors,
    warnings,
    overfullHbox,
    underfullHbox,
    missingFonts: Array.from(missingFontsSet).sort(),
    missingReferences: Array.from(missingRefsSet).sort(),
    missingPackages: Array.from(missingPackagesSet).sort(),
    missingImages: Array.from(missingImagesSet).sort(),
  };
}
