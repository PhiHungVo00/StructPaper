import { describe, it, expect } from 'vitest';
import { VirtualFS } from '../src/wasm/virtual-fs';

describe('packages/compiler-client - VirtualFS', () => {
  it('stores and retrieves text and binary files', () => {
    const fs = new VirtualFS();
    fs.writeFile('main.tex', '\\documentclass{article}');
    expect(fs.exists('main.tex')).toBe(true);
    expect(fs.readTextFile('main.tex')).toBe('\\documentclass{article}');

    const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
    fs.writeFile('assets/image.png', binaryData);
    expect(fs.exists('assets/image.png')).toBe(true);
    expect(fs.readFile('assets/image.png')).toEqual(binaryData);
  });

  it('normalizes file paths consistently', () => {
    const fs = new VirtualFS();
    fs.writeFile('/styles\\template.sty', '% style file');
    expect(fs.exists('styles/template.sty')).toBe(true);
    expect(fs.readTextFile('/styles/template.sty')).toBe('% style file');
    expect(fs.readTextFile('styles\\template.sty')).toBe('% style file');
  });

  it('returns null for nonexistent files', () => {
    const fs = new VirtualFS();
    expect(fs.readFile('nonexistent.txt')).toBeNull();
    expect(fs.readTextFile('nonexistent.txt')).toBeNull();
    expect(fs.exists('nonexistent.txt')).toBe(false);
  });

  it('deletes files and updates file listing', () => {
    const fs = new VirtualFS();
    fs.writeFile('a.txt', 'hello');
    fs.writeFile('b.txt', 'world');
    expect(fs.listFiles()).toEqual(['a.txt', 'b.txt']);

    const deleted = fs.deleteFile('a.txt');
    expect(deleted).toBe(true);
    expect(fs.exists('a.txt')).toBe(false);
    expect(fs.listFiles()).toEqual(['b.txt']);

    const deletedAgain = fs.deleteFile('a.txt');
    expect(deletedAgain).toBe(false);
  });

  it('tracks total size in bytes accurately', () => {
    const fs = new VirtualFS();
    expect(fs.getTotalSizeBytes()).toBe(0);

    fs.writeFile('a.txt', '12345'); // 5 bytes
    expect(fs.getTotalSizeBytes()).toBe(5);

    fs.writeFile('b.bin', new Uint8Array([10, 20, 30])); // 3 bytes
    expect(fs.getTotalSizeBytes()).toBe(8);

    fs.deleteFile('a.txt');
    expect(fs.getTotalSizeBytes()).toBe(3);
  });

  it('stages compilation request (LaTeX source and base64 images)', () => {
    const fs = new VirtualFS();
    // 4-byte base64 string "AQID" -> [1, 2, 3]
    const base64Png = 'AQID';
    fs.stage({
      tex: '\\begin{document}Hello\\end{document}',
      images: {
        'figures/chart.png': base64Png,
        'logo.png': 'BAUG', // [4, 5, 6]
      },
    });

    expect(fs.readTextFile('main.tex')).toBe('\\begin{document}Hello\\end{document}');
    expect(fs.exists('figures/chart.png')).toBe(true);
    expect(fs.readFile('figures/chart.png')).toEqual(new Uint8Array([1, 2, 3]));
    expect(fs.exists('logo.png')).toBe(true);
    expect(fs.readFile('logo.png')).toEqual(new Uint8Array([4, 5, 6]));
  });

  it('retrieves generated PDF output with getOutputPdf', () => {
    const fs = new VirtualFS();
    expect(fs.getOutputPdf()).toBeNull();

    const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    fs.writeFile('main.pdf', dummyPdf);
    expect(fs.getOutputPdf()).toEqual(dummyPdf);

    fs.writeFile('custom.pdf', dummyPdf);
    expect(fs.getOutputPdf('custom.pdf')).toEqual(dummyPdf);
  });

  it('performs zero-leak cleanup on clear()', () => {
    const fs = new VirtualFS();
    fs.writeFile('main.tex', 'latex');
    fs.writeFile('figure.png', new Uint8Array([1, 2, 3]));
    expect(fs.listFiles().length).toBe(2);
    expect(fs.getTotalSizeBytes()).toBeGreaterThan(0);

    fs.clear();
    expect(fs.listFiles()).toEqual([]);
    expect(fs.getTotalSizeBytes()).toBe(0);
    expect(fs.exists('main.tex')).toBe(false);
    expect(fs.readFile('figure.png')).toBeNull();
  });
});
