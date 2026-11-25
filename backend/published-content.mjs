import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../frontend/src/mockData.ts';

export const categories = CATEGORIES.map(({ name }) => name);
const directory = fileURLToPath(new URL('./content/', import.meta.url));

export function readPublishedPosts() {
  const posts = [];
  const ids = new Set();
  for (const name of readdirSync(directory).filter(name => name.endsWith('.json'))) {
    const raw = JSON.parse(readFileSync(join(directory, name), 'utf8').replace(/^\uFEFF/, ''));
    const { id, slug, title, excerpt, category, tags, publishedAt, readTime, content, japaneseTitle = null } = raw;
    if (raw.status !== undefined && raw.status !== 'published') throw new Error(`Only published posts belong in ${name}`);
    if (![id, slug, title, excerpt, readTime, content].every(field => typeof field === 'string' && field.trim()) ||
        !categories.includes(category) || !Array.isArray(tags) || !tags.every(tag => typeof tag === 'string') ||
        !Number.isFinite(Date.parse(publishedAt)) || (japaneseTitle !== null && typeof japaneseTitle !== 'string')) {
      throw new Error(`Invalid journal entry in ${name}`);
    }
    if (name !== slug + '.json' || !/^[\p{L}\p{N}-]+$/u.test(slug) || ids.has(id)) {
      throw new Error(`Check the filename, slug and unique post ID in ${name}`);
    }
    ids.add(id);
    posts.push({ id, slug, title, excerpt, category, tags, publishedAt: new Date(publishedAt).toISOString(), readTime, japaneseTitle, content });
  }
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
}
