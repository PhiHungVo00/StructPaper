const fs = require('fs');
const path = require('path');
const jszip = require('jszip');

async function runForensics() {
  console.log('=== FORENSIC INSPECTION OF ID630 DEMO FILES ===\n');

  const demoDir = path.resolve('c:/Users/OWNER/source/Eatzy/StructPaper/File demo');
  const texPath = path.join(demoDir, 'ID630_HS-2026-10-02-06-42.tex');
  const docxPath = path.join(demoDir, 'ID630_HS-2026-10-02-06-42.docx');
  const pdfPath = path.join(demoDir, 'ID630_HS-2026-10-02-07-07.pdf');

  // --- 1. TeX GEOMETRY & TYPOGRAPHY ---
  console.log('--- 1. LATEX SOURCE ANALYSIS ---');
  if (fs.existsSync(texPath)) {
    const tex = fs.readFileSync(texPath, 'utf8');
    const lines = tex.split('\n');
    
    // Geometry packages & setups
    console.log('Geometry definitions:');
    lines.forEach((l, i) => {
      if (l.includes('geometry') || l.includes('paperheight') || l.includes('paperwidth') || l.includes('margin') || l.includes('columnsep')) {
        console.log(`  Line ${i+1}: ${l.trim()}`);
      }
    });

    console.log('\nHeader / Footer definitions:');
    lines.forEach((l, i) => {
      if (l.includes('fancyhead') || l.includes('fancyfoot') || l.includes('headheight') || l.includes('headsep') || l.includes('footskip')) {
        console.log(`  Line ${i+1}: ${l.trim()}`);
      }
    });

    console.log('\nFonts and sizes:');
    lines.forEach((l, i) => {
      if (l.includes('\\fontsize') || l.includes('\\setmainfont') || l.includes('Minion') || l.includes('Myriad') || l.includes('Times')) {
        console.log(`  Line ${i+1}: ${l.trim()}`);
      }
    });

    console.log('\nColors defined:');
    lines.forEach((l, i) => {
      if (l.includes('definecolor')) {
        console.log(`  Line ${i+1}: ${l.trim()}`);
      }
    });

    console.log('\nSection/Abstract/Sidebar definitions:');
    lines.forEach((l, i) => {
      if (l.includes('\\title{') || l.includes('\\author{') || l.includes('abstract') || l.includes('twocolumn') || l.includes('onecolumn')) {
        console.log(`  Line ${i+1}: ${l.trim().slice(0, 100)}`);
      }
    });
  }

  // --- 2. DOCX OPENXML ANALYSIS ---
  console.log('\n--- 2. DOCX OPENXML ANALYSIS ---');
  if (fs.existsSync(docxPath)) {
    const data = fs.readFileSync(docxPath);
    const zip = await jszip.loadAsync(data);

    if (zip.file('word/document.xml')) {
      const docXml = await zip.file('word/document.xml').async('string');
      
      // Page size
      const pgSzMatch = docXml.match(/<w:pgSz[^>]+>/g);
      console.log('Page Size (<w:pgSz>):', pgSzMatch);

      // Page Margins
      const pgMarMatch = docXml.match(/<w:pgMar[^>]+>/g);
      console.log('Page Margins (<w:pgMar>):', pgMarMatch);

      // Columns
      const colsMatch = docXml.match(/<w:cols[^>]+>/g);
      console.log('Columns (<w:cols>):', colsMatch);

      // Section properties
      const sectPrMatch = docXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g);
      if (sectPrMatch) {
        console.log(`Found ${sectPrMatch.length} sections in DOCX`);
        sectPrMatch.forEach((s, idx) => {
          console.log(`  Section ${idx+1}:`, s.replace(/\s+/g, ' '));
        });
      }
    }

    if (zip.file('word/styles.xml')) {
      const stylesXml = await zip.file('word/styles.xml').async('string');
      console.log('\nStyles extracted from word/styles.xml:');
      
      // Extract style tags
      const styleMatches = stylesXml.match(/<w:style[^>]+w:styleId="([^"]+)"[\s\S]*?<\/w:style>/g);
      if (styleMatches) {
        styleMatches.forEach(st => {
          const id = st.match(/w:styleId="([^"]+)"/)?.[1];
          const name = st.match(/<w:name w:val="([^"]+)"/)?.[1];
          const rFonts = st.match(/<w:rFonts[^>]+>/)?.[0];
          const sz = st.match(/<w:sz w:val="([^"]+)"/)?.[1];
          const spacing = st.match(/<w:spacing[^>]+>/)?.[0];
          const color = st.match(/<w:color w:val="([^"]+)"/)?.[1];
          if (['Title', 'Heading1', 'Heading2', 'Heading3', 'Normal', 'Abstract', 'Header', 'Footer', 'Affiliation', 'Author'].some(k => id && id.toLowerCase().includes(k.toLowerCase()) || name && name.toLowerCase().includes(k.toLowerCase()))) {
            console.log(`  Style: [${id}] "${name}" | Font: ${rFonts || ''} | Size: ${sz ? (sz/2)+'pt' : 'default'} | Color: ${color || ''} | Spacing: ${spacing || ''}`);
          }
        });
      }
    }
  }

  // --- 3. PDF EXTRACT VIA PDFJS ---
  console.log('\n--- 3. PDF ACCURATE MEASUREMENTS (pdfjs-dist) ---');
  if (fs.existsSync(pdfPath)) {
    const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjs.getDocument({ data });
    const doc = await loadingTask.promise;
    console.log(`PDF Pages count: ${doc.numPages}`);

    for (let pNum = 1; pNum <= Math.min(3, doc.numPages); pNum++) {
      console.log(`\n================ PAGE ${pNum} ANALYSIS ================`);
      const page = await doc.getPage(pNum);
      const viewport = page.getViewport({ scale: 1.0 });
      console.log(`Viewport: width = ${viewport.width} pt (${(viewport.width * 25.4 / 72).toFixed(2)} mm), height = ${viewport.height} pt (${(viewport.height * 25.4 / 72).toFixed(2)} mm)`);

      const textContent = await page.getTextContent();
      const items = textContent.items;

      const analyzedItems = items.filter(it => it.str.trim().length > 0).map(it => {
        const x = it.transform[4];
        const y = it.transform[5];
        const top = viewport.height - y;
        const fontSize = Math.sqrt(it.transform[0]*it.transform[0] + it.transform[1]*it.transform[1]);
        const width = it.width;
        return {
          text: it.str,
          xPt: x,
          xMm: x * 25.4 / 72,
          yPt: y,
          topPt: top,
          topMm: top * 25.4 / 72,
          fontSize: fontSize,
          fontName: it.fontName,
          widthPt: width,
          widthMm: width * 25.4 / 72
        };
      });

      const minX = Math.min(...analyzedItems.map(it => it.xMm));
      const maxX = Math.max(...analyzedItems.map(it => it.xMm + it.widthMm));
      const minTop = Math.min(...analyzedItems.map(it => it.topMm));
      const maxTop = Math.max(...analyzedItems.map(it => it.topMm));

      console.log(`Page ${pNum} Overall Text Boundaries:`);
      console.log(`  Min Left: ${minX.toFixed(2)} mm (${(minX * 72 / 25.4).toFixed(2)} pt)`);
      console.log(`  Max Right: ${maxX.toFixed(2)} mm (${(maxX * 72 / 25.4).toFixed(2)} pt)`);
      console.log(`  Min Top (Header): ${minTop.toFixed(2)} mm (${(minTop * 72 / 25.4).toFixed(2)} pt)`);
      console.log(`  Max Top (Footer): ${maxTop.toFixed(2)} mm (${(maxTop * 72 / 25.4).toFixed(2)} pt)`);

      // Let's inspect Page 1 zones
      if (pNum === 1) {
        console.log('\nPage 1 Structural breakdown:');
        // Running header
        const p1Header = analyzedItems.filter(it => it.topMm < 25);
        console.log('  Header elements:');
        p1Header.forEach(it => console.log(`    [x: ${it.xMm.toFixed(1)}mm, top: ${it.topMm.toFixed(1)}mm, sz: ${it.fontSize.toFixed(1)}pt] "${it.text}"`));

        // Sidebar elements (x < 60mm and top > 60mm)
        const p1Sidebar = analyzedItems.filter(it => it.xMm < 60 && it.topMm >= 60 && it.topMm <= 265);
        console.log(`\n  Sidebar elements (${p1Sidebar.length} items, x range: [${Math.min(...p1Sidebar.map(i=>i.xMm)).toFixed(1)}mm - ${Math.max(...p1Sidebar.map(i=>i.xMm + i.widthMm)).toFixed(1)}mm]):`);
        p1Sidebar.slice(0, 10).forEach(it => console.log(`    [x: ${it.xMm.toFixed(1)}mm, top: ${it.topMm.toFixed(1)}mm, sz: ${it.fontSize.toFixed(1)}pt] "${it.text}"`));

        // Right side elements (x >= 60mm)
        const p1Right = analyzedItems.filter(it => it.xMm >= 60 && it.topMm >= 60);
        console.log(`\n  Right zone elements (${p1Right.length} items, x range: [${Math.min(...p1Right.map(i=>i.xMm)).toFixed(1)}mm - ${Math.max(...p1Right.map(i=>i.xMm + i.widthMm)).toFixed(1)}mm]):`);
        // Check column 1 vs column 2 in right zone
        const rightCol1 = p1Right.filter(it => it.topMm > 140 && it.xMm < 135);
        const rightCol2 = p1Right.filter(it => it.topMm > 140 && it.xMm >= 135);
        if (rightCol1.length) {
          console.log(`    Right Col 1: [${Math.min(...rightCol1.map(i=>i.xMm)).toFixed(1)}mm - ${Math.max(...rightCol1.map(i=>i.xMm+i.widthMm)).toFixed(1)}mm] (width: ${(Math.max(...rightCol1.map(i=>i.xMm+i.widthMm)) - Math.min(...rightCol1.map(i=>i.xMm))).toFixed(1)}mm)`);
        }
        if (rightCol2.length) {
          console.log(`    Right Col 2: [${Math.min(...rightCol2.map(i=>i.xMm)).toFixed(1)}mm - ${Math.max(...rightCol2.map(i=>i.xMm+i.widthMm)).toFixed(1)}mm] (width: ${(Math.max(...rightCol2.map(i=>i.xMm+i.widthMm)) - Math.min(...rightCol2.map(i=>i.xMm))).toFixed(1)}mm)`);
        }
      }

      if (pNum >= 2) {
        console.log(`\nPage ${pNum} Structural breakdown:`);
        const pHeader = analyzedItems.filter(it => it.topMm < 25);
        console.log('  Header:');
        pHeader.forEach(it => console.log(`    [x: ${it.xMm.toFixed(1)}mm, top: ${it.topMm.toFixed(1)}mm, sz: ${it.fontSize.toFixed(1)}pt] "${it.text}"`));

        const body = analyzedItems.filter(it => it.topMm >= 25 && it.topMm <= 265);
        console.log(`  Body text x range: [${Math.min(...body.map(i=>i.xMm)).toFixed(1)}mm - ${Math.max(...body.map(i=>i.xMm+i.widthMm)).toFixed(1)}mm]`);

        const pFooter = analyzedItems.filter(it => it.topMm > 265);
        console.log('  Footer:');
        pFooter.forEach(it => console.log(`    [x: ${it.xMm.toFixed(1)}mm, top: ${it.topMm.toFixed(1)}mm, sz: ${it.fontSize.toFixed(1)}pt] "${it.text}"`));

        // Two columns on page 2
        const col1 = body.filter(it => it.xMm < 135);
        const col2 = body.filter(it => it.xMm >= 135);
        if (col1.length) {
          console.log(`  Col 1: [${Math.min(...col1.map(i=>i.xMm)).toFixed(1)}mm - ${Math.max(...col1.map(i=>i.xMm+i.widthMm)).toFixed(1)}mm] (width: ${(Math.max(...col1.map(i=>i.xMm+i.widthMm)) - Math.min(...col1.map(i=>i.xMm))).toFixed(1)}mm)`);
        }
        if (col2.length) {
          console.log(`  Col 2: [${Math.min(...col2.map(i=>i.xMm)).toFixed(1)}mm - ${Math.max(...col2.map(i=>i.xMm+i.widthMm)).toFixed(1)}mm] (width: ${(Math.max(...col2.map(i=>i.xMm+i.widthMm)) - Math.min(...col2.map(i=>i.xMm))).toFixed(1)}mm)`);
        }
      }
    }
  }
}

runForensics().catch(console.error);
