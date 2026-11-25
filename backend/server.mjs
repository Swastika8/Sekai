import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createBlogApi } from './api.mjs';

const dist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
let index;
try {
  index = readFileSync(resolve(dist, 'index.html'), 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.error('Build the journal first with npm --prefix frontend run build.');
  process.exit(1);
}

const api = createBlogApi();
const mimeTypes = {
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.avif': 'image/avif', '.txt': 'text/plain; charset=utf-8',
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

async function servePage(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let path;
  try {
    path = decodeURIComponent(new URL(request.url, 'http://sekai.local').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  const filePath = resolve(dist, `.${path}`);
  const relativePath = relative(dist, filePath);
  const type = mimeTypes[extname(filePath)];
  const file = type && relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath)
    ? statSync(filePath, { throwIfNoEntry: false }) : null;

  if (file?.isFile()) {
    response.writeHead(200, {
      'Content-Type': type,
      'Content-Length': file.size,
      'Cache-Control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (request.method === 'HEAD') response.end();
    else await pipeline(createReadStream(filePath), response);
    return;
  }

  const articlePath = /^\/posts\/([^/]+)\/?$/.exec(path);
  const post = articlePath && api.findPublished(articlePath[1]);
  const studio = path === '/studio' || path === '/studio/';
  const status = path === '/' || studio || post ? 200 : 404;
  const html = post ? index
    .replace(/<title>[^<]+<\/title>/, () => `<title>${escapeHtml(post.title)} · Sekai</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, () => `<meta name="description" content="${escapeHtml(post.excerpt)}" />`)
    : index;

  response.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    ...(studio ? { 'X-Robots-Tag': 'noindex' } : {}),
  });
  response.end(request.method === 'HEAD' ? undefined : html);
}

const server = createServer({ headersTimeout: 15_000, requestTimeout: 60_000, maxHeaderSize: 16_384 }, (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.SEKAI_PUBLIC_ORIGIN) response.setHeader('Strict-Transport-Security', 'max-age=31536000');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  void api.handle(request, response, () => servePage(request, response)).catch((error) => {
    if (response.destroyed) return;
    console.error('Sekai request failed:', error);
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
});

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
server.once('close', api.close);
server.listen(port, host, () => console.log(`Sekai is listening at http://${host}:${port}`));
