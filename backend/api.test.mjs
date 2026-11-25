import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createBlogApi } from './api.mjs';

test('only the owner can publish, and drafts stay private', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'sekai-api-'));
  process.env.SEKAI_DATA_DIR = directory;
  process.env.SEKAI_PUBLIC_ORIGIN = '';
  process.env.SEKAI_STUDIO_PASSWORD = randomUUID();
  const api = createBlogApi();
  const server = createServer((req, res) => api.handle(req, res, () => res.writeHead(404).end()));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  function write(path, method, body, headers = {}) {
    return fetch(origin + '/api/studio/' + path, {
      method, headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
    });
  }
  try {
    assert.equal((await fetch(origin + '/api/studio/posts')).status, 401);
    const credentials = { password: process.env.SEKAI_STUDIO_PASSWORD };
    assert.equal((await write('login', 'POST', credentials, { origin: 'https://other.example' })).status, 403);
    assert.equal((await write('login', 'POST', { password: 'a'.repeat(4100) })).status, 413);
    const login = await write('login', 'POST', credentials);
    assert.equal(login.status, 200);
    const headers = { cookie: login.headers.get('set-cookie').split(';')[0] };
    const post = { title: "A reader's question", content: 'An ordinary note.', excerpt: 'A question.', category: 'Thoughts', tags: [], status: 'draft', revision: 0 };
    const path = 'posts/' + randomUUID();
    assert.equal((await write(path, 'PUT', post)).status, 401);
    const draft = await write(path, 'PUT', post, headers);
    assert.equal(draft.status, 200);
    const { slug, revision } = await draft.json();
    const article = origin + '/api/posts/' + slug;
    assert.equal((await fetch(article)).status, 404);
    assert.equal((await (await fetch(origin + '/api/posts')).json()).some(p => p.slug === slug), false);
    assert.equal((await write(path, 'PUT', { ...post, status: 'published', revision }, headers)).status, 200);
    assert.equal((await (await fetch(article)).json()).title, post.title);
    assert.equal((await write('logout', 'POST', {}, headers)).status, 200);
    assert.equal((await fetch(origin + '/api/studio/posts', { headers })).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    api.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
