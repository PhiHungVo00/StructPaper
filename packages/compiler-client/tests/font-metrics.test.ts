import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import {
  LIBERATION_SANS_REGULAR_BASE64,
  LIBERATION_SANS_BOLD_BASE64,
} from '../src/wasm/fonts/liberation-sans';

describe('packages/compiler-client - font-metrics', () => {
  it('registers LiberationSans fonts and renders Vietnamese text into valid PDF buffer', () => {
    const doc = new jsPDF({ format: 'a4', unit: 'pt' });

    doc.addFileToVFS('LiberationSans-Regular.ttf', LIBERATION_SANS_REGULAR_BASE64);
    doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal');

    doc.addFileToVFS('LiberationSans-Bold.ttf', LIBERATION_SANS_BOLD_BASE64);
    doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold');

    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(16);
    doc.text('CĂN TÍNH VÀ KHÔNG GIAN VĂN HÓA', 40, 50);

    doc.setFont('LiberationSans', 'normal');
    doc.setFontSize(10);
    const testText =
      'Căn tính (identity) là một khái niệm đa chiều, phản ánh cách cá nhân và cộng đồng định nghĩa bản thân.';
    doc.text(testText, 40, 80);

    const pdfBuffer = doc.output('arraybuffer');
    expect(pdfBuffer.byteLength).toBeGreaterThan(15000);

    const header = Buffer.from(pdfBuffer).slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });
});
