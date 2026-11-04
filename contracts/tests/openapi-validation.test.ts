import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { ManuscriptSchema } from '@structpaper/doc-model';

describe('Task 2.2: OpenAPI Contract Validation (CỔNG 2)', () => {
  const openApiPath = path.resolve(__dirname, '../openapi.yaml');

  it('contracts/openapi.yaml exists and parses as valid YAML', () => {
    expect(fs.existsSync(openApiPath)).toBe(true);
    const content = fs.readFileSync(openApiPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);

    const doc = YAML.parse(content);
    expect(doc).toBeDefined();
    expect(typeof doc).toBe('object');
  });

  it('complies with OpenAPI 3.0.3 top-level specification structure', () => {
    const rawYaml = fs.readFileSync(openApiPath, 'utf-8');
    const doc = YAML.parse(rawYaml);

    // OpenAPI 3.0.x declaration
    expect(doc.openapi).toBe('3.0.3');
    expect(doc.info).toBeDefined();
    expect(doc.info.title).toBe('StructPaper API');
    expect(doc.info.version).toBe('2.0.0');
    expect(typeof doc.info.description).toBe('string');

    // Servers configuration
    expect(Array.isArray(doc.servers)).toBe(true);
    expect(doc.servers.length).toBeGreaterThanOrEqual(1);
    expect(doc.servers[0].url).toBeDefined();

    // Paths and Components
    expect(doc.paths).toBeDefined();
    expect(doc.components).toBeDefined();
    expect(doc.components.schemas).toBeDefined();
  });

  it('defines all 9 required endpoint routes and their HTTP methods', () => {
    const rawYaml = fs.readFileSync(openApiPath, 'utf-8');
    const doc = YAML.parse(rawYaml);
    const paths = doc.paths;

    // 1. GET & PUT /api/v1/manuscripts/{id}
    const manuscriptPath = paths['/api/v1/manuscripts/{id}'];
    expect(manuscriptPath).toBeDefined();
    expect(manuscriptPath.get).toBeDefined();
    expect(manuscriptPath.get.responses['200'].headers.ETag).toBeDefined();
    expect(manuscriptPath.get.responses['200'].content['application/json'].schema.$ref).toBe(
      '#/components/schemas/Manuscript'
    );
    expect(manuscriptPath.get.responses['404']).toBeDefined();

    expect(manuscriptPath.put).toBeDefined();
    const ifMatch = manuscriptPath.put.parameters.find(
      (p: { name: string; in: string }) => p.name === 'If-Match' && p.in === 'header'
    );
    expect(ifMatch).toBeDefined();
    expect(ifMatch.required).toBe(true);
    expect(manuscriptPath.put.requestBody.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/Manuscript'
    );
    expect(manuscriptPath.put.responses['200']).toBeDefined();
    expect(manuscriptPath.put.responses['400']).toBeDefined();
    expect(manuscriptPath.put.responses['404']).toBeDefined();
    expect(manuscriptPath.put.responses['412']).toBeDefined();

    // 2. GET /api/v1/manuscripts/{id}/revisions
    const revisionsPath = paths['/api/v1/manuscripts/{id}/revisions'];
    expect(revisionsPath).toBeDefined();
    expect(revisionsPath.get).toBeDefined();
    expect(revisionsPath.get.responses['200'].content['application/json'].schema.type).toBe('array');

    // 3. HEAD, PUT, GET /api/v1/assets/{sha256}
    const assetsPath = paths['/api/v1/assets/{sha256}'];
    expect(assetsPath).toBeDefined();
    expect(assetsPath.head).toBeDefined();
    expect(assetsPath.head.responses['200'].headers['Content-Length']).toBeDefined();
    expect(assetsPath.head.responses['404']).toBeDefined();

    expect(assetsPath.put).toBeDefined();
    const putUploadContent = assetsPath.put.requestBody.content;
    expect(putUploadContent['application/octet-stream']).toBeDefined();
    expect(putUploadContent['image/png']).toBeDefined();
    expect(putUploadContent['image/jpeg']).toBeDefined();
    expect(putUploadContent['application/pdf']).toBeDefined();
    expect(assetsPath.put.responses['200']).toBeDefined();
    expect(assetsPath.put.responses['201']).toBeDefined();

    expect(assetsPath.get).toBeDefined();
    const getDownloadContent = assetsPath.get.responses['200'].content;
    expect(getDownloadContent['application/octet-stream']).toBeDefined();
    expect(getDownloadContent['image/png']).toBeDefined();
    expect(assetsPath.get.responses['404']).toBeDefined();

    // 4. POST /api/v1/compile
    const compilePath = paths['/api/v1/compile'];
    expect(compilePath).toBeDefined();
    expect(compilePath.post).toBeDefined();
    expect(compilePath.post.requestBody.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/CompileRequest'
    );
    expect(compilePath.post.responses['200']).toBeDefined();
    expect(compilePath.post.responses['202']).toBeDefined();

    // 5. GET & DELETE /api/v1/compile/{jobId}
    const compileJobPath = paths['/api/v1/compile/{jobId}'];
    expect(compileJobPath).toBeDefined();
    expect(compileJobPath.get).toBeDefined();
    expect(compileJobPath.get.responses['200'].content['application/json'].schema.$ref).toBe(
      '#/components/schemas/CompileJobStatus'
    );
    expect(compileJobPath.delete).toBeDefined();
    expect(compileJobPath.delete.responses['200'].content['application/json'].schema.$ref).toBe(
      '#/components/schemas/CancelJobResponse'
    );

    // 6. GET /api/v1/compile/{jobId}/events (SSE)
    const compileEventsPath = paths['/api/v1/compile/{jobId}/events'];
    expect(compileEventsPath).toBeDefined();
    expect(compileEventsPath.get).toBeDefined();
    expect(compileEventsPath.get.responses['200'].content['text/event-stream']).toBeDefined();

    // 7. GET /api/v1/journals/{id}/profile
    const journalsPath = paths['/api/v1/journals/{id}/profile'];
    expect(journalsPath).toBeDefined();
    expect(journalsPath.get).toBeDefined();
    expect(journalsPath.get.responses['200'].content['application/json'].schema.$ref).toBe(
      '#/components/schemas/JournalProfile'
    );

    // 8. POST /api/v1/ai/extract
    const aiExtractPath = paths['/api/v1/ai/extract'];
    expect(aiExtractPath).toBeDefined();
    expect(aiExtractPath.post).toBeDefined();
    expect(aiExtractPath.post.requestBody.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/AIExtractRequest'
    );
    expect(aiExtractPath.post.responses['200']).toBeDefined();
    expect(aiExtractPath.post.responses['400']).toBeDefined();
    expect(aiExtractPath.post.responses['413']).toBeDefined();

    // 9. POST /api/v1/batches
    const batchesPath = paths['/api/v1/batches'];
    expect(batchesPath).toBeDefined();
    expect(batchesPath.post).toBeDefined();
    expect(batchesPath.post.requestBody.content['multipart/form-data']).toBeDefined();
    expect(batchesPath.post.responses['202']).toBeDefined();
  });

  it('resolves all $ref references within components/schemas with zero broken links', () => {
    const rawYaml = fs.readFileSync(openApiPath, 'utf-8');
    const doc = YAML.parse(rawYaml);
    const schemas = doc.components.schemas;

    // Collect all $ref in the entire document
    const refs: string[] = [];
    function collectRefs(obj: unknown) {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        for (const item of obj) collectRefs(item);
      } else {
        const record = obj as Record<string, unknown>;
        if (typeof record.$ref === 'string') {
          refs.push(record.$ref);
        }
        for (const key of Object.keys(record)) {
          collectRefs(record[key]);
        }
      }
    }
    collectRefs(doc);

    expect(refs.length).toBeGreaterThan(30);

    for (const ref of refs) {
      expect(ref.startsWith('#/components/schemas/')).toBe(true);
      const schemaName = ref.replace('#/components/schemas/', '');
      expect(schemas[schemaName]).toBeDefined();
    }
  });

  it('mirrors Manuscript v2 schema and properties exactly as defined in packages/doc-model', () => {
    const rawYaml = fs.readFileSync(openApiPath, 'utf-8');
    const doc = YAML.parse(rawYaml);
    const schemas = doc.components.schemas;

    const manuscript = schemas.Manuscript;
    expect(manuscript).toBeDefined();
    expect(manuscript.type).toBe('object');

    // schemaVersion locked to 2
    expect(manuscript.properties.schemaVersion.type).toBe('integer');
    expect(manuscript.properties.schemaVersion.enum).toEqual([2]);

    // id references ULID
    expect(manuscript.properties.id.$ref).toBe('#/components/schemas/ULID');

    // lang is vi | en
    expect(manuscript.properties.lang.enum).toEqual(['vi', 'en']);

    // meta references FrontMatter
    expect(manuscript.properties.meta.$ref).toBe('#/components/schemas/FrontMatter');

    // body is array of Section
    expect(manuscript.properties.body.type).toBe('array');
    expect(manuscript.properties.body.items.$ref).toBe('#/components/schemas/Section');

    // references is array of Reference
    expect(manuscript.properties.references.type).toBe('array');
    expect(manuscript.properties.references.items.$ref).toBe('#/components/schemas/Reference');

    // assets is map of AssetMeta
    expect(manuscript.properties.assets.type).toBe('object');
    expect(manuscript.properties.assets.additionalProperties.$ref).toBe('#/components/schemas/AssetMeta');

    // required fields match
    const expectedRequired = [
      'schemaVersion',
      'id',
      'lang',
      'journalId',
      'articleType',
      'meta',
      'body',
      'back',
      'references',
      'assets',
    ];
    for (const field of expectedRequired) {
      expect(manuscript.required).toContain(field);
    }
  });

  it('defines ULID and Sha256Hash with strict regex patterns', () => {
    const rawYaml = fs.readFileSync(openApiPath, 'utf-8');
    const doc = YAML.parse(rawYaml);
    const schemas = doc.components.schemas;

    const ulidPattern = new RegExp(schemas.ULID.pattern);
    expect(ulidPattern.test('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe(true);
    expect(ulidPattern.test('01ARZ3NDEKTSV4RRFFQ69G5FA')).toBe(false); // 25 chars
    expect(ulidPattern.test('01ARZ3NDEKTSV4RRFFQ69G5FAV1')).toBe(false); // 27 chars

    const sha256Pattern = new RegExp(schemas.Sha256Hash.pattern);
    expect(
      sha256Pattern.test('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    ).toBe(true);
    expect(sha256Pattern.test('invalid_hash')).toBe(false);
  });

  it('defines all 8 Block variants and 6 Inline variants', () => {
    const rawYaml = fs.readFileSync(openApiPath, 'utf-8');
    const doc = YAML.parse(rawYaml);
    const schemas = doc.components.schemas;

    // 8 Blocks
    const blockOneOf = schemas.Block.oneOf.map(
      (item: { $ref: string }) => item.$ref.replace('#/components/schemas/', '')
    );
    expect(blockOneOf).toContain('ParagraphBlock');
    expect(blockOneOf).toContain('ListBlock');
    expect(blockOneOf).toContain('QuoteBlock');
    expect(blockOneOf).toContain('BoxBlock');
    expect(blockOneOf).toContain('EquationBlock');
    expect(blockOneOf).toContain('FigureBlock');
    expect(blockOneOf).toContain('TableBlock');
    expect(blockOneOf).toContain('PageBreakBlock');
    expect(blockOneOf.length).toBe(8);

    // 6 Inlines
    const inlineOneOf = schemas.Inline.oneOf.map(
      (item: { $ref: string }) => item.$ref.replace('#/components/schemas/', '')
    );
    expect(inlineOneOf).toContain('TextInline');
    expect(inlineOneOf).toContain('CiteInline');
    expect(inlineOneOf).toContain('XrefInline');
    expect(inlineOneOf).toContain('MathInline');
    expect(inlineOneOf).toContain('FootnoteInline');
    expect(inlineOneOf).toContain('LinkInline');
    expect(inlineOneOf.length).toBe(6);
  });

  it('defines JournalProfile schema matching packages/journal-profiles contract', () => {
    const rawYaml = fs.readFileSync(openApiPath, 'utf-8');
    const doc = YAML.parse(rawYaml);
    const schemas = doc.components.schemas;

    const profile = schemas.JournalProfile;
    expect(profile).toBeDefined();

    const expectedKeys = [
      'id',
      'version',
      'names',
      'color',
      'languages',
      'articleTypes',
      'frontMatter',
      'citation',
      'styleMap',
      'layout',
      'typography',
      'latex',
      'qc',
    ];
    for (const key of expectedKeys) {
      expect(profile.required).toContain(key);
      expect(profile.properties[key]).toBeDefined();
    }
  });

  it('cross-validates doc-model Manuscript fixture against schema rules', () => {
    const sampleManuscript = {
      schemaVersion: 2,
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      lang: 'vi',
      journalId: 'VNUHCM-HS',
      articleType: 'research-article',
      meta: {
        title: [{ t: 'text', v: 'Nghiên cứu về tổng hợp vật liệu nano' }],
        authors: [
          {
            id: 'auth-01ARZ3NDEKTSV4RRFFQ69G5FA1',
            name: 'PGS. TS. Trần Văn B',
            affiliationIds: ['aff-01ARZ3NDEKTSV4RRFFQ69G5FA2'],
            email: 'tvb@vnuhcm.edu.vn',
            isCorresponding: true,
          },
        ],
        affiliations: [
          {
            id: 'aff-01ARZ3NDEKTSV4RRFFQ69G5FA2',
            institution: 'Trường Đại học Bách khoa, ĐHQG-HCM',
            department: 'Khoa Kỹ thuật Hóa học',
            city: 'TP. Hồ Chí Minh',
            country: 'Việt Nam',
          },
        ],
        abstract: [[{ t: 'text', v: 'Bài báo trình bày quy trình...' }]],
        keywords: ['vật liệu nano', 'tổng hợp hóa học'],
        dates: {
          received: '2026-03-01',
          accepted: '2026-04-15',
        },
      },
      body: [
        {
          id: 'sec-01ARZ3NDEKTSV4RRFFQ69G5FA3',
          level: 1,
          title: [{ t: 'text', v: '1. Giới thiệu chung' }],
          blocks: [
            {
              type: 'paragraph',
              id: 'blk-01ARZ3NDEKTSV4RRFFQ69G5FA4',
              content: [
                { t: 'text', v: 'Vật liệu nano có nhiều ứng dụng ' },
                { t: 'cite', refIds: ['ref-01ARZ3NDEKTSV4RRFFQ69G5FA5'] },
              ],
            },
          ],
          children: [],
        },
      ],
      back: [],
      references: [
        {
          id: 'ref-01ARZ3NDEKTSV4RRFFQ69G5FA5',
          raw: 'Nguyen, V. A. et al. (2025). Advanced Nanomaterials, 12(3), 45-56.',
          parse: 'ok',
        },
      ],
      assets: {},
    };

    const parsed = ManuscriptSchema.safeParse(sampleManuscript);
    expect(parsed.success).toBe(true);
  });
});
