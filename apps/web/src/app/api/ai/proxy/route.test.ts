import { describe, test, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('Server AI Proxy Route (/api/ai/proxy)', () => {
  const originalEnv = process.env.OPENAI_API_KEY;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-server-secret-key-12345';
    originalFetch = global.fetch;
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalEnv;
    global.fetch = originalFetch;
  });

  function createRequest(
    body: Record<string, any>,
    headers: Record<string, string> = {}
  ): NextRequest {
    const rawBody = JSON.stringify(body);
    const defaultHeaders: Record<string, string> = {
      'content-type': 'application/json',
      'host': 'localhost:3000',
      'origin': 'http://localhost:3000',
      'sec-fetch-site': 'same-origin',
      ...headers,
    };

    return new NextRequest('http://localhost:3000/api/ai/proxy', {
      method: 'POST',
      headers: defaultHeaders,
      body: rawBody,
    });
  }

  test('Rejects cross-site requests (sec-fetch-site: cross-site) with 403', async () => {
    const req = createRequest(
      { action: 'metadata', text: 'Tiêu đề bài báo' },
      { 'sec-fetch-site': 'cross-site' }
    );
    const res = await POST(req);
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.match(json.error, /cùng nguồn gốc|cross-site/i);
  });

  test('Rejects mismatched origin header with 403', async () => {
    const req = createRequest(
      { action: 'metadata', text: 'Tiêu đề bài báo' },
      {
        'origin': 'https://malicious-attacker.com',
        'host': 'structpaper.vn',
      }
    );
    const res = await POST(req);
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.match(json.error, /nguồn gốc|origin/i);
  });

  test('Rejects non-whitelisted action with 400', async () => {
    const req = createRequest({
      action: 'arbitrary_action',
      text: 'Sample paper text',
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.match(json.error, /hành động không hợp lệ/i);
  });

  test('Rejects missing text / tableText with 400', async () => {
    const req = createRequest({
      action: 'metadata',
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.match(json.error, /thiếu dữ liệu văn bản/i);
  });

  test('Rejects payload with text exceeding 15000 characters with 413', async () => {
    const oversizedText = 'A'.repeat(15001);
    const req = createRequest({
      action: 'metadata',
      text: oversizedText,
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 413);
    const json = await res.json();
    assert.match(json.error, /vượt quá giới hạn/i);
  });

  test('Rejects when OPENAI_API_KEY is not configured on server with 500', async () => {
    delete process.env.OPENAI_API_KEY;
    const req = createRequest({
      action: 'metadata',
      text: 'Nghiên cứu về vật liệu mới',
      apiKey: 'sk-client-supplied-key-attempt',
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 500);
    const json = await res.json();
    assert.match(json.error, /chưa được cấu hình/i);
  });

  test('Client-supplied apiKey is ignored and server OPENAI_API_KEY is used exclusively', async () => {
    process.env.OPENAI_API_KEY = 'sk-correct-server-key';
    let interceptedAuthHeader = '';

    global.fetch = async (url: any, init?: any) => {
      interceptedAuthHeader = init?.headers?.Authorization || '';
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ title: 'Mocked Title' }) } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    };

    const req = createRequest({
      action: 'metadata',
      text: 'Nội dung bài báo mẫu',
      apiKey: 'sk-attacker-or-client-key',
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.title, 'Mocked Title');
    assert.strictEqual(interceptedAuthHeader, 'Bearer sk-correct-server-key');
  });

  test('Successfully processes table extraction action', async () => {
    process.env.OPENAI_API_KEY = 'sk-correct-server-key';
    let calledPrompt = '';

    global.fetch = async (url: any, init?: any) => {
      const parsedBody = JSON.parse(init.body);
      calledPrompt = parsedBody.messages[1].content;
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  caption: 'Bảng 1: Kết quả thử nghiệm',
                  headers: ['Cột 1', 'Cột 2'],
                  rows: [['A', 'B']],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    };

    const req = createRequest({
      action: 'table',
      text: 'Bảng 1: Kết quả thử nghiệm\nCột 1\tCột 2\nA\tB',
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.caption, 'Bảng 1: Kết quả thử nghiệm');
    assert.match(calledPrompt, /chuyên gia trích xuất dữ liệu khoa học/i);
  });

  test('Accepts alias action extractFrontMatter as metadata', async () => {
    process.env.OPENAI_API_KEY = 'sk-correct-server-key';

    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ title: 'Tiêu đề trích xuất' }) } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    };

    const req = createRequest({
      action: 'extractFrontMatter',
      text: 'Bản thảo khoa học Đại học Quốc gia...',
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.title, 'Tiêu đề trích xuất');
  });
});
