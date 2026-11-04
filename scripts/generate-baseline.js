const fs = require('fs');
const path = require('path');

function countLines(content) {
  const lines = content.split(/\r?\n/);
  let count = 0;
  let inBlockComment = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      continue;
    }
    if (trimmed.startsWith('//')) continue;
    count++;
  }
  return { codeLines: count, totalLines: lines.length };
}

function walk(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.next') {
        res = res.concat(walk(p));
      }
    } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
      res.push(p);
    }
  }
  return res;
}

const rootDir = path.resolve(__dirname, '..');
const webSrc = path.join(rootDir, 'apps/web/src');
const files = walk(webSrc);

const allowlist = [];
const limits = {};

for (const fullPath of files) {
  const content = fs.readFileSync(fullPath, 'utf8');
  const { codeLines, totalLines } = countLines(content);
  const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

  // Any legacy file exceeding 500 lines total or code lines
  if (totalLines > 500 || codeLines > 400) {
    allowlist.push(relPath);
    limits[relPath] = {
      totalLines,
      codeLines,
      maxAllowedTotal: totalLines,
      maxAllowedCode: codeLines,
    };
  }
}

allowlist.sort();

const output = {
  $description: 'Baseline allowlist for legacy files exceeding line limits. Lines may only decrease, never increase.',
  allowlist,
  limits,
};

fs.writeFileSync(
  path.join(__dirname, 'baseline-line-limits.json'),
  JSON.stringify(output, null, 2) + '\n'
);

console.log(`Generated baseline-line-limits.json with ${allowlist.length} files.`);
