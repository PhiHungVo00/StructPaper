import qrcode from 'qrcode-generator';
import { hasPublicationValue } from './publication';

/** The link a DOI points to, or null when there is no real DOI yet ("?" / blank). */
export function doiToUrl(doi: string | undefined): string | null {
  const v = (doi || '').trim();
  if (!hasPublicationValue(v)) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return /^10\.\d{4,9}\//.test(v) ? `https://doi.org/${v}` : null;
}

/**
 * A QR code drawn with plain TeX rules (no image file, no package), so it prints the same on every
 * engine (MiKTeX, TeX Live, Tectonic, the packaged app) and stays sharp at any size.
 * `sizeCm` is the full width including a one-module white margin.
 */
export function qrToLatex(text: string, sizeCm = 2.2): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const m = ((sizeCm * 72.27) / 2.54 / (n + 2)).toFixed(3); // module size in pt
  const row = (r: number): string => {
    let out = '';
    let c = 0;
    while (c < n) {
      const dark = qr.isDark(r, c);
      let k = 1;
      while (c + k < n && qr.isDark(r, c + k) === dark) k++;
      const w = `${(k * Number(m)).toFixed(3)}pt`;
      out += dark ? `\\vrule width ${w} height ${m}pt depth 0pt` : `\\kern ${w}`;
      c += k;
    }
    return `\\hbox{\\kern ${m}pt ${out}\\kern ${m}pt}%`;
  };
  const rows = Array.from({ length: n }, (_, r) => row(r)).join('\n');
  return `{\\color{black}\\offinterlineskip\\vbox{\\kern ${m}pt%\n${rows}\n\\kern ${m}pt}}`;
}

/** What the title block puts above "Use your smartphone to scan this QR code…". */
export function qrBlockFor(doi: string | undefined): string {
  const url = doiToUrl(doi);
  return url ? qrToLatex(url) : '\\vspace*{1.5cm}';
}
