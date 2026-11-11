import type { CompletePaper } from '@/types/paper';

/** Figure pictures of a paper as the files the LaTeX source refers to (fig1.png, image1.jpg, …), base64 encoded. */
export function extractPaperImages(paper: CompletePaper): Record<string, string> {
  const images: Record<string, string> = {};
  let figIdx = 1;
  (paper.sections || []).forEach((sec, idx) => {
    if (sec.type === 'figure' && sec.figure?.src) {
      const num = sec.figure.num || figIdx++;
      if (sec.figure.src.startsWith('data:image')) {
        const parts = sec.figure.src.split(',');
        if (parts[1]) {
          const base64Data = parts[1];
          const isJpg =
            sec.figure.src.startsWith('data:image/jpeg') ||
            sec.figure.src.startsWith('data:image/jpg');
          const ext = isJpg ? 'jpg' : 'png';

          images[`fig${num}.${ext}`] = base64Data;
          images[`fig${num}.png`] = base64Data;
          images[`fig${num}.jpg`] = base64Data;
          images[`image${num}.${ext}`] = base64Data;
          images[`image${idx + 1}.${ext}`] = base64Data;
          images[`fig${idx + 1}.png`] = base64Data;
          images[`fig${idx + 1}.jpg`] = base64Data;
        }
      }
    }
  });
  return images;
}
