import { createHash, randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { categories, openStore } from './store.mjs';

const envFile = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const hashPassword = promisify(scrypt);
const sessionLifetime = 60 * 60 * 8;
const maxBodyBytes = 768 * 1024;
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const localAddresses = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function requireSameOrigin(request, publicOrigin) {
  const origin = URL.parse(request.headers.origin ?? '');
  const fetchSite = request.headers['sec-fetch-site'];
  const protocol = request.socket.encrypted ? 'https' : 'http';
  const matchesOrigin = publicOrigin ? origin?.origin === publicOrigin
    : isLocalRequest(request) && origin?.origin === protocol + '://' + request.headers.host;
  if (!origin || !['http:', 'https:'].includes(origin.protocol) || !matchesOrigin || (fetchSite && fetchSite !== 'same-origin')) {
    throw new ApiError(403, 'Open the studio on the same address as the journal.');
  }
  return origin;
}

function isLocalRequest(request) {
  const host = URL.parse(`http://${request.headers.host ?? ''}`);
  return localHosts.has(host?.hostname) && localAddresses.has(request.socket.remoteAddress);
}

async function readJson(request, limit = maxBodyBytes) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new ApiError(415, 'Send a JSON request.');
  }
  const chunks = [];
  if (Number(request.headers['content-length']) > limit) throw new ApiError(413, 'Request body is too large.');
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > limit) {
      request.resume();
      throw new ApiError(413, 'This post is too large to save.');
    }
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'The request contains invalid JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Send a JSON object.');
  return body;
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 256;
}

function validatePost(body) {
  const { category, status, revision } = body;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : '';
  if (!title || title.length > 160) throw new ApiError(400, 'Enter a title with 1–160 characters.');
  if (!categories.includes(category)) throw new ApiError(400, 'Choose a journal topic.');
  if (!['draft', 'published'].includes(status) || !Number.isSafeInteger(revision) || revision < 0) {
    throw new ApiError(400, 'Reload the studio and try again.');
  }
  if (excerpt.length > 350 || content.length > 100_000) throw new ApiError(400, 'Shorten the summary or article.');
  if (status === 'published' && (!excerpt || !content)) throw new ApiError(400, 'Add a summary and article before publishing.');
  if (!Array.isArray(body.tags) || body.tags.length > 8 || body.tags.some((tag) => typeof tag !== 'string' || tag.length > 48)) {
    throw new ApiError(400, 'Use up to eight tags of 48 characters each.');
  }
  const tags = [...new Set(body.tags.map((tag) => tag.trim()).filter(Boolean))];
  return { title, excerpt, content, category, tags, status, revision };
}

function digest(token) {
  return createHash('sha256').update(token).digest('hex');
}

function sessionHash(request) {
  const token = request.headers.cookie?.split(';').map((value) => value.trim()).find((value) => value.startsWith('sekai_session='))?.slice(14);
  return token && /^[a-f\d]{64}$/.test(token) ? digest(token) : '';
}

function sessionCookie(response, token, maxAge, secure) {
  response.setHeader('Set-Cookie', `sekai_session=${token}; Path=/api/studio; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`);
}

export function createBlogApi() {
  const publicOrigin = process.env.SEKAI_PUBLIC_ORIGIN ? new URL(process.env.SEKAI_PUBLIC_ORIGIN).origin : '';
  if (publicOrigin && !publicOrigin.startsWith('https://')) throw new Error('Use an HTTPS address for SEKAI_PUBLIC_ORIGIN.');
  const configuredPassword = process.env.SEKAI_STUDIO_PASSWORD;
  if (configuredPassword && !validPassword(configuredPassword)) throw new Error('SEKAI_STUDIO_PASSWORD must be 12–256 characters.');

  const directory = process.env.SEKAI_DATA_DIR || fileURLToPath(new URL('./data/', import.meta.url));
  const store = openStore(directory);
  if (configuredPassword && !store.getOwner()) {
    const salt = randomBytes(16).toString('hex');
    store.createOwner(salt, scryptSync(configuredPassword, salt, 64).toString('hex'));
  }

  const loginAttempts = new Map();
  let passwordJobs = 0;
  async function derivePassword(password, salt) {
    if (passwordJobs >= 2) throw new ApiError(429, 'Studio sign-in is busy. Try again shortly.');
    passwordJobs++;
    try { return await hashPassword(password, salt, 64); }
    finally { passwordJobs--; }
  }
  function logAttempt(request, response) {
    const now = Date.now();
    const address = request.socket.remoteAddress ?? 'unknown';
    for (const [key, entry] of loginAttempts) {
      if (entry.until <= now) loginAttempts.delete(key);
    }
    const attempt = loginAttempts.get(address) ?? { count: 0, until: now + 10 * 60_000 };
    if (attempt.count >= 12 || (!loginAttempts.has(address) && loginAttempts.size >= 512)) {
      response.setHeader('Retry-After', Math.max(1, Math.ceil((attempt.until - now) / 1_000)));
      throw new ApiError(429, 'Too many sign-in attempts. Try again in a few minutes.');
    }
    attempt.count += 1;
    loginAttempts.set(address, attempt);
    return address;
  }

  function startSession(response, origin) {
    const token = randomBytes(32).toString('hex');
    store.createSession(digest(token), Date.now() + sessionLifetime * 1_000);
    sessionCookie(response, token, sessionLifetime, origin.protocol === 'https:');
  }

  async function handle(request, response, next) {
    const url = URL.parse(request.url ?? '/', 'http://sekai.local');
    const path = url?.pathname;
    if (!path || !path.startsWith('/api/')) return next();

    try {
      const method = request.method;
      if (method === 'GET' && path === '/api/profile') return send(response, 200, store.getProfile());
      if (method === 'GET' && path === '/api/posts') return send(response, 200, store.listPublished());
      const postPath = /^\/api\/posts\/([^/]+)$/.exec(path);
      if (method === 'GET' && postPath) {
        const post = store.findPublished(decodeURIComponent(postPath[1]));
        if (!post) throw new ApiError(404, 'This article could not be found.');
        return send(response, 200, post);
      }

      if (!path.startsWith('/api/studio/')) throw new ApiError(404, 'Page not found.');
      const tokenHash = sessionHash(request);
      const signedIn = store.hasSession(tokenHash);
      const owner = store.getOwner();
      const setupAvailable = !owner && !publicOrigin && isLocalRequest(request);

      if (method === 'GET' && path === '/api/studio/session') {
        return send(response, 200, { signedIn, hasOwner: Boolean(owner), setupAvailable });
      }

      const origin = method === 'GET' ? null : requireSameOrigin(request, publicOrigin);
      if (method === 'POST' && path === '/api/studio/setup') {
        if (!setupAvailable) throw new ApiError(403, 'Studio setup is unavailable at this address.');
        const { password } = await readJson(request, 4096);
        if (!validPassword(password)) throw new ApiError(400, 'Use a password with 12–256 characters.');
        const salt = randomBytes(16).toString('hex');
        const hash = await derivePassword(password, salt);
        if (!store.createOwner(salt, hash.toString('hex'))) throw new ApiError(409, 'The studio is already set up. Sign in instead.');
        startSession(response, origin);
        return send(response, 201, { signedIn: true });
      }

      if (method === 'POST' && path === '/api/studio/login') {
        if (!owner) throw new ApiError(403, 'Set the studio password before signing in.');
        const address = logAttempt(request, response);
        const { password } = await readJson(request, 4096);
        const hash = validPassword(password) ? await derivePassword(password, owner.salt) : Buffer.alloc(64);
        if (!timingSafeEqual(hash, Buffer.from(owner.hash, 'hex'))) throw new ApiError(401, 'The password is incorrect.');
        loginAttempts.delete(address);
        startSession(response, origin);
        return send(response, 200, { signedIn: true });
      }

      if (method === 'POST' && path === '/api/studio/logout') {
        if (signedIn) store.endSession(tokenHash);
        sessionCookie(response, '', 0, origin.protocol === 'https:');
        return send(response, 200, { signedIn: false });
      }

      if (!signedIn) throw new ApiError(401, 'Sign in to access the studio.');
      if (method === 'PUT' && path === '/api/studio/profile') {
        const { medium } = await readJson(request, 8192);
        const url = typeof medium === 'string' && URL.parse(medium.trim());
        if (medium !== '' && (!url || url.protocol !== 'https:' || url.username || url.password)) {
          throw new ApiError(400, 'Enter an HTTPS profile URL or clear the field.');
        }
        if (!store.hasSession(tokenHash)) throw new ApiError(401, 'Sign in again to save your profile.');
        store.setMedium(url ? url.href : '');
        return send(response, 200, store.getProfile());
      }
      if (method === 'GET' && path === '/api/studio/posts') return send(response, 200, store.listForStudio());
      const editorPath = /^\/api\/studio\/posts\/([a-z\d-]{6,64})$/.exec(path);
      if (method === 'PUT' && editorPath) {
        const post = validatePost(await readJson(request));
        if (!store.hasSession(tokenHash)) throw new ApiError(401, 'Your session expired. Sign in again.');
        const saved = store.savePost(editorPath[1], post);
        if (!saved) throw new ApiError(409, 'This post changed in another tab. Copy any unsaved text, then reload the studio.');
        return send(response, 200, saved);
      }

      throw new ApiError(404, 'Page not found.');
    } catch (error) {
      if (error instanceof ApiError) return send(response, error.status, { error: error.message });
      if (error instanceof URIError) return send(response, 400, { error: 'Invalid article address.' });
      console.error('Sekai API request failed:', error);
      if (!response.headersSent && !response.destroyed) send(response, 500, { error: 'Something went wrong. Try again in a moment.' });
    }
  }

  return { handle, findPublished: store.findPublished, close: store.close };
}
