import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { deserializeTemplatePackage } from '@/lib/template-engine/storage';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'src/data/templates');

/**
 * GET /api/templates/[id]
 * Loads and returns the full template schema JSON file by ID.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 });
    }

    if (!fs.existsSync(TEMPLATES_DIR)) {
      return NextResponse.json({ error: 'Templates directory not found' }, { status: 404 });
    }

    // Direct filename check: id.json or normalized id
    const directFile = path.join(TEMPLATES_DIR, `${id}.json`);
    if (fs.existsSync(directFile)) {
      const content = fs.readFileSync(directFile, 'utf8');
      return new NextResponse(content, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Also check with hyphenated filename (e.g. vnuhcm_health_sciences_id630 -> vnuhcm-health-sciences-id630.json)
    const hyphenatedFile = path.join(TEMPLATES_DIR, `${id.replace(/_/g, '-')}.json`);
    if (fs.existsSync(hyphenatedFile)) {
      const content = fs.readFileSync(hyphenatedFile, 'utf8');
      return new NextResponse(content, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Search through all json files for matching template ID
    const allFiles = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));
    for (const f of allFiles) {
      try {
        const filePath = path.join(TEMPLATES_DIR, f);
        const content = fs.readFileSync(filePath, 'utf8');
        const { success, schema } = deserializeTemplatePackage(content);
        if (success && schema && (schema.id === id || f === `${id}.json`)) {
          return new NextResponse(content, {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch {}
    }

    return NextResponse.json({ error: `Template "${id}" not found` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error fetching template', details: error?.message },
      { status: 500 }
    );
  }
}
