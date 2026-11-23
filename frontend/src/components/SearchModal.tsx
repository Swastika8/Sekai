import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { articleUrl, type PostSummary } from '../blog';

const normalize = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

export function SearchModal({ posts, onClose }: { posts: PostSummary[] | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const keywords = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const results = posts?.filter((post) => {
    const haystack = normalize([post.title, post.japaneseTitle, post.excerpt, post.category, ...post.tags].join(' '));
    return keywords.every((word) => haystack.includes(word));
  }).slice(0, 8) ?? [];

  useEffect(() => {
    dialog.current?.showModal();
    input.current?.focus();
  }, []);

  return (
    <dialog className="search-dialog" ref={dialog} aria-labelledby="search-title" onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="search-panel">
        <div className="search-heading">
          <h2 id="search-title">Search the journal</h2>
          <button type="button" className="icon-button" aria-label="Close search" onClick={() => dialog.current?.close()}>
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} type="search"
            aria-label="Search by title, topic, or tag" placeholder="Title, topic, or tag" />
        </label>
        <div className="search-results">
          {!posts && <p role="status">Journal entries aren’t available yet.</p>}
          {posts && !results.length && <p role="status">No entries match your search.</p>}
          {!!results.length && <ul>{results.map((post) => (
            <li key={post.id}>
              <a href={articleUrl(post.slug)}>
                <span className="post-topic">{post.category}</span>
                <span>{post.title}</span>
              </a>
            </li>
          ))}</ul>}
        </div>
      </div>
    </dialog>
  );
}

