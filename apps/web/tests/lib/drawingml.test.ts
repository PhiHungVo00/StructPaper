import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { drawingToSvg, isShapeDrawing } from '@/lib/drawingml';
import { pairShapeDrawings } from '@/lib/docx-figures';

const FIXTURE = path.resolve(__dirname, '../../../../fixtures/golden/papers/eic_stdjelm,+Journal+editor,+3.+1750.docx');

describe('DrawingML redraw', () => {
  it('ignores pictures and draws ellipse + text + arrow', () => {
    const pic = '<w:drawing><wp:inline><wp:extent cx="10" cy="10"/><a:blip r:embed="rId1"/></wp:inline></w:drawing>';
    expect(isShapeDrawing(pic)).toBe(false);
    expect(drawingToSvg(pic)).toBeNull();

    const xml = `<w:drawing><wp:anchor><wp:extent cx="2540000" cy="1270000"/><a:graphic><a:graphicData><wpg:wgp>
      <wpg:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2540000" cy="1270000"/><a:chOff x="0" y="0"/><a:chExt cx="2540000" cy="1270000"/></a:xfrm></wpg:grpSpPr>
      <wps:wsp><wps:spPr><a:xfrm><a:off x="100000" y="100000"/><a:ext cx="900000" cy="400000"/></a:xfrm><a:prstGeom prst="ellipse"/><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></wps:spPr>
        <wps:txbx><w:txbxContent><w:p><w:r><w:t>Alpha</w:t></w:r></w:p></w:txbxContent></wps:txbx></wps:wsp>
      <wps:wsp><wps:spPr><a:xfrm><a:off x="1000000" y="300000"/><a:ext cx="800000" cy="0"/></a:xfrm><a:prstGeom prst="line"/><a:ln><a:solidFill><a:srgbClr val="0000FF"/></a:solidFill><a:tailEnd type="triangle"/></a:ln></wps:spPr></wps:wsp>
    </wpg:wgp></a:graphicData></a:graphic></wp:anchor></w:drawing>`;
    const r = drawingToSvg(xml)!;
    expect(r.svg).toContain('<ellipse');
    expect(r.svg).toContain('fill="#FF0000"');
    expect(r.svg).toContain('>Alpha</text>');
    expect(r.svg).toContain('marker-end');
  });

  it('pairs Figure 1 of the real fixture with its shape drawing and renders it', async () => {
    const zip = await JSZip.loadAsync(fs.readFileSync(FIXTURE));
    const doc = await zip.file('word/document.xml')!.async('text');
    const theme = await zip.file('word/theme/theme1.xml')?.async('text');
    const pairs = pairShapeDrawings(doc, new Set([2]));
    expect(pairs.has(1)).toBe(true);
    const svg = drawingToSvg(pairs.get(1)!, theme)!;
    expect(svg.svg).toContain('Chuyển đổi số');
    expect((svg.svg.match(/<ellipse/g) || []).length).toBe(6);
  });
});
