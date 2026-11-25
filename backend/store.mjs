import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { readPublishedPosts } from './published-content.mjs';
import publicProfile from './public-profile.json' with { type: 'json' };
export { categories } from './published-content.mjs';

const postColumns = `id, slug, title, excerpt, category, tags,
  published_at AS publishedAt, read_time AS readTime, japanese_title AS japaneseTitle`;
const editorColumns = `${postColumns}, content, status, revision`;

function unpack(row) {
  return row && { ...row, tags: JSON.parse(row.tags) };
}

function transaction(db, run) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = run();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function createJournal(db) {
  db.exec(`
    CREATE TABLE posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      japanese_title TEXT,
      read_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft', 'published')),
      published_at TEXT,
      updated_at TEXT NOT NULL,
      revision INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX posts_by_publication ON posts(status, published_at DESC);
    CREATE TABLE owner (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      salt TEXT NOT NULL,
      hash TEXT NOT NULL
    ) STRICT;
    CREATE TABLE sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    ) STRICT;
  `);

  const insert = db.prepare(`
    INSERT INTO posts (id, slug, title, excerpt, content, category, tags,
      japanese_title, read_time, status, published_at, updated_at, revision)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, 1)
  `);

  for (const post of readPublishedPosts()) {
    insert.run(post.id, post.slug, post.title, post.excerpt, post.content.trim(), post.category,
      JSON.stringify(post.tags), post.japaneseTitle, post.readTime, post.publishedAt, post.publishedAt);
  }
}

function migrate(db) {
  transaction(db, () => {
    const version = db.prepare('PRAGMA user_version').get().user_version;
    if (version >= 3) return;

    if (version === 0) {
      createJournal(db);
    } else if (version === 1) {
      // Studio edits advance the revision, so personalized copies survive the upgrade.
      db.exec("DELETE FROM posts WHERE id IN ('post-1', 'post-2') AND revision = 1");
    }
    db.exec('CREATE TABLE profile (id INTEGER PRIMARY KEY CHECK(id = 1), medium TEXT NOT NULL) STRICT');
    db.exec('PRAGMA user_version = 3');
  });
}

function slugFor(db, title, id) {
  const normalized = title.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '-');
  const base = [...normalized].slice(0, 72).join('').replace(/^-+|-+$/g, '') || `post-${id.slice(0, 8)}`;
  const exists = db.prepare('SELECT 1 FROM posts WHERE slug = ?');
  let slug = base;
  let suffix = 2;
  while (exists.get(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export function openStore(directory) {
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(resolve(directory, 'sekai.sqlite'), { timeout: 5_000 });
  db.exec('PRAGMA journal_mode = WAL');
  migrate(db);

  return {
    getProfile() {
      return db.prepare('SELECT medium FROM profile WHERE id = 1').get() ?? publicProfile;
    },
    setMedium(url) {
      db.prepare('INSERT INTO profile VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET medium = excluded.medium').run(url);
    },
    listPublished() {
      return db.prepare(`SELECT ${postColumns} FROM posts WHERE status = 'published'
        ORDER BY published_at DESC, id`).all().map(unpack);
    },
    findPublished(slug) {
      return unpack(db.prepare(`SELECT ${postColumns}, content FROM posts
        WHERE slug = ? AND status = 'published'`).get(slug));
    },
    listForStudio() {
      return db.prepare(`SELECT ${editorColumns} FROM posts ORDER BY updated_at DESC, id`).all().map(unpack);
    },
    savePost(id, post) {
      return transaction(db, () => {
        const current = db.prepare(`SELECT ${editorColumns} FROM posts WHERE id = ?`).get(id);
        if ((current?.revision ?? 0) !== post.revision) return null;

        const now = new Date().toISOString();
        const slug = current?.slug ?? slugFor(db, post.title, id);
        const publishedAt = post.status === 'published' ? current?.publishedAt ?? now : null;
        const words = post.content.match(/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|[\p{L}\p{N}]+/gu)?.length ?? 0;
        const readTime = current?.content === post.content ? current.readTime : `${Math.max(1, Math.ceil(words / 220))} min read`;

        db.prepare(`
          INSERT INTO posts (id, slug, title, excerpt, content, category, tags,
            read_time, status, published_at, updated_at, revision)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET title = excluded.title, excerpt = excluded.excerpt,
            content = excluded.content, category = excluded.category, tags = excluded.tags,
            read_time = excluded.read_time, status = excluded.status, published_at = excluded.published_at,
            updated_at = excluded.updated_at, revision = excluded.revision
        `).run(id, slug, post.title, post.excerpt, post.content, post.category, JSON.stringify(post.tags),
          readTime, post.status, publishedAt, now, post.revision + 1);

        return unpack(db.prepare(`SELECT ${editorColumns} FROM posts WHERE id = ?`).get(id));
      });
    },
    getOwner() {
      return db.prepare('SELECT salt, hash FROM owner WHERE id = 1').get();
    },
    createOwner(salt, hash) {
      return db.prepare('INSERT OR IGNORE INTO owner (id, salt, hash) VALUES (1, ?, ?)').run(salt, hash).changes === 1;
    },
    hasSession(tokenHash) {
      return Boolean(db.prepare('SELECT 1 FROM sessions WHERE token_hash = ? AND expires_at > ?').get(tokenHash, Date.now()));
    },
    createSession(tokenHash, expiresAt) {
      db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
      db.prepare('INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)').run(tokenHash, expiresAt);
    },
    endSession(tokenHash) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    },
    close() {
      db.close();
    },
  };
}
