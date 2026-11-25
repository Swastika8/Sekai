function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function articleHtml(template, post) {
  return template
    .replace(/<title>[^<]+<\/title>/, () => `<title>${escapeHtml(post.title)} · Sekai</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, () => `<meta name="description" content="${escapeHtml(post.excerpt)}" />`);
}
