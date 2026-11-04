import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { page, imageBase64 } = await req.json();
    if (!page || !imageBase64) {
      return NextResponse.json({ error: 'Missing page or imageBase64' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const outDir = path.join(process.cwd(), 'public', 'demo-assets', 'id630', 'pages');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const filePath = path.join(outDir, `page-${page}.png`);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, path: `/demo-assets/id630/pages/page-${page}.png` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
