import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readPublishedPosts } from './published-content.mjs';
import { articleHtml } from './article-html.mjs';
import publicProfile from './public-profile.json' with { type: 'json' };

const output = new URL('../frontend/dist-pages/', import.meta.url);
const posts = readPublishedPosts();
const index = readFileSync(new URL('index.html', output), 'utf8');
writeFileSync(new URL('404.html', output), index);
mkdirSync(new URL('journal-data/posts/', output), { recursive: true });
for (const post of posts) {
  writeFileSync(new URL('journal-data/posts/' + post.slug + '.json', output), JSON.stringify(post));
  const page = new URL('posts/' + post.slug + '/', output);
  mkdirSync(page, { recursive: true });
  writeFileSync(new URL('index.html', page), articleHtml(index, post));
}
writeFileSync(new URL('journal-data/posts.json', output), JSON.stringify(posts.map(({ content, ...summary }) => summary)));
const medium = process.env.SEKAI_MEDIUM_URL?.trim() ?? publicProfile.medium;
const profile = URL.parse(medium);
if (medium && (!profile || profile.protocol !== 'https:' || profile.username || profile.password)) {
  throw new Error('SEKAI_MEDIUM_URL must be a public HTTPS profile URL');
}
writeFileSync(new URL('journal-data/profile.json', output), JSON.stringify({ medium: profile?.href ?? '' }));
writeFileSync(new URL('_headers', output), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-ancestors 'none'; object-src 'none'; base-uri 'none'\n");
