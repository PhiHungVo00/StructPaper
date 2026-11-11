import { describe, it, expect } from 'vitest';
import { createEmptyPaper, type CompletePaper } from '@/types/paper';
import { DocumentApi, ApiError } from '@/lib/documents/document-api';
import { DocumentSync, packForServer, unpackFromServer, ASSET_PREFIX, documentName } from '@/lib/documents/document-sync';

const PNG = new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], { type: 'image/png' });

/** Minimal in-memory backend behind a fake fetch. */
function fakeServer() {
  const docs = new Map<string, any>();
  const assets = new Map<string, Blob>();
  const calls: string[] = [];
  const fetchImpl = async (url: string, init: RequestInit = {}) => {
    const method = (init.method || 'GET').toUpperCase();
    const path = url.replace('http://x', '');
    calls.push(`${method} ${path}`);
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
    let m: RegExpMatchArray | null;
    if ((m = path.match(/^\/api\/v1\/assets\/(\w+)$/))) {
      if (method === 'PUT') { assets.set(m[1], init.body as Blob); return json({}, 201); }
      if (method === 'HEAD') return new Response(null, { status: assets.has(m[1]) ? 200 : 404 });
      const a = assets.get(m[1]);
      return a ? new Response(a) : json({ message: 'nf' }, 404);
    }
    if ((m = path.match(/^\/api\/v1\/documents\/([\w-]+)$/))) {
      const id = m[1];
      if (method === 'PUT') {
        const body = JSON.parse(init.body as string);
        const cur = docs.get(id);
        if (cur && body.baseRev !== undefined && body.baseRev !== cur.rev) return json({ message: 'conflict' }, 412);
        const rev = cur ? cur.rev + 1 : 1;
        docs.set(id, { id, name: body.name ?? cur?.name, rev, doc: body.doc ?? cur?.doc, status: body.status || 'draft' });
        return json({ id, name: docs.get(id).name, rev, updatedAt: 'now', snapshotted: !!body.snapshot });
      }
      if (method === 'GET') return docs.has(id) ? json(docs.get(id)) : json({ message: 'nf' }, 404);
    }
    if (path === '/api/v1/documents') return json([...docs.values()].map(({ doc, ...s }) => s));
    return json({ message: 'unhandled' }, 500);
  };
  return { api: new DocumentApi('http://x', fetchImpl as any), docs, assets, calls };
}

function paperWithImage(): CompletePaper {
  const p = createEmptyPaper();
  p.id = 'doc1';
  p.metadata.title = 'Bài báo';
  p.sections = [
    { id: 'f', type: 'figure', content: '', figure: { id: 'f', num: 1, caption: 'c', src: 'data:image/png;base64,iVBORw==' } },
  ];
  return p;
}

describe('DocumentSync', () => {
  it('uploads images once as content-addressed assets and stores references, not pixels', async () => {
    const srv = fakeServer();
    const deps = { api: srv.api, readBlob: async () => PNG };
    const packed = await packForServer(paperWithImage(), deps);
    const src = packed.sections[0].figure!.src;
    expect(src.startsWith(ASSET_PREFIX)).toBe(true);
    expect(srv.assets.size).toBe(1);
    await packForServer(paperWithImage(), deps); // second call: HEAD hit, no re-upload
    expect(srv.calls.filter((c) => c.startsWith('PUT /api/v1/assets'))).toHaveLength(1);
  });

  it('round-trips: push then pull restores the image as a data URL and the name', async () => {
    const srv = fakeServer();
    const sync = new DocumentSync({ api: srv.api, readBlob: async () => PNG });
    const p = paperWithImage();
    (p as any).displayName = 'Tên do người dùng đặt';
    await sync.push(p);
    const pulled = await sync.pull('doc1');
    expect(pulled.sections[0].figure!.src.startsWith('data:image/png;base64,')).toBe(true);
    expect((pulled as any).displayName).toBe('Tên do người dùng đặt');
    expect(pulled.metadata.title).toBe('Bài báo');
  });

  it('tracks revisions and surfaces a conflict when another session saved first', async () => {
    const srv = fakeServer();
    const a = new DocumentSync({ api: srv.api, readBlob: async () => PNG });
    const b = new DocumentSync({ api: srv.api, readBlob: async () => PNG });
    const p = paperWithImage();
    await a.push(p); // rev 1
    await b.pull('doc1'); // b knows rev 1
    await a.push(p); // rev 2
    await expect(b.push(p)).rejects.toMatchObject({ isConflict: true });
    await expect(b.push(p, { force: true })).resolves.toMatchObject({ rev: 3 });
  });

  it('reports network failure distinctly from HTTP errors', async () => {
    const api = new DocumentApi('http://x', (async () => { throw new TypeError('fail'); }) as any);
    await expect(api.list()).rejects.toSatisfy((e: unknown) => (e as ApiError).isNetwork);
  });

  it('keeps unresolved asset references when the asset is missing', async () => {
    const srv = fakeServer();
    const p = paperWithImage();
    p.sections[0].figure!.src = `${ASSET_PREFIX}deadbeef`;
    const out = await unpackFromServer(p, { api: srv.api });
    expect(out.sections[0].figure!.src).toBe(`${ASSET_PREFIX}deadbeef`);
  });

  it('derives a document name from displayName, then title', () => {
    const p = createEmptyPaper();
    p.metadata.title = 'Tiêu đề';
    expect(documentName(p)).toBe('Tiêu đề');
    (p as any).displayName = 'Tên file';
    expect(documentName(p)).toBe('Tên file');
  });
});
