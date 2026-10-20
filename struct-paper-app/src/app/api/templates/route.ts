import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  deserializeTemplatePackage,
  extractTemplateManifest,
  validateTemplateSchema,
  serializeTemplatePackage,
} from '@/lib/template-engine/storage';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'src/data/templates');
const PUBLIC_TEMPLATES_DIR = path.resolve(process.cwd(), 'public/templates');

/**
 * GET /api/templates
 * Returns manifests of all registered template files.
 */
export async function GET() {
  try {
    const manifests = [];
    const seenIds = new Set<string>();

    if (fs.existsSync(TEMPLATES_DIR)) {
      const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));

      for (const file of files) {
        try {
          const filePath = path.join(TEMPLATES_DIR, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const { success, schema } = deserializeTemplatePackage(content);

          if (success && schema && !seenIds.has(schema.id)) {
            const manifest = extractTemplateManifest(schema, false);
            manifest.filePath = `/templates/${file}`;
            manifests.push(manifest);
            seenIds.add(schema.id);
          }
        } catch (e) {
          console.error(`[API /api/templates] Error reading template file ${file}:`, e);
        }
      }
    }

    return NextResponse.json(manifests, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list templates', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Saves a new template to disk after schema validation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateTemplateSchema(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Template schema validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Determine id and filename
    const id = body.id || (body.specification ? body.id : `template_${Date.now()}`);
    const safeFilename = `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;

    // Ensure directories exist
    if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    if (!fs.existsSync(PUBLIC_TEMPLATES_DIR)) fs.mkdirSync(PUBLIC_TEMPLATES_DIR, { recursive: true });

    // Pack into standardized template package
    const { schema } = deserializeTemplatePackage(JSON.stringify(body));
    if (!schema) {
      return NextResponse.json({ error: 'Could not deserialize schema' }, { status: 400 });
    }

    const packaged = serializeTemplatePackage(schema);
    const jsonStr = JSON.stringify(packaged, null, 2);

    fs.writeFileSync(path.join(TEMPLATES_DIR, safeFilename), jsonStr, 'utf8');
    fs.writeFileSync(path.join(PUBLIC_TEMPLATES_DIR, safeFilename), jsonStr, 'utf8');

    return NextResponse.json(
      {
        success: true,
        message: `Template "${schema.name}" saved successfully`,
        id: schema.id,
        manifest: extractTemplateManifest(schema, false),
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to save template', details: error?.message },
      { status: 500 }
    );
  }
}
