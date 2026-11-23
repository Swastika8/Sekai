import { useEffect, useState, type FormEvent } from 'react';
import { articleUrl, errorMessage, request, TOPICS, useResource, writeRequest } from '../blog';
import type { PostStatus, Session, StudioPost, Topic } from '../blog';
import { MarkdownBody } from './MarkdownBody';

function StudioAccess({ hasOwner, setupAvailable, onSignIn }: {
  hasOwner: boolean;
  setupAvailable: boolean;
  onSignIn: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const setup = !hasOwner && setupAvailable;

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (setup && confirmation !== password) {
      setError('The passwords don’t match.');
      return;
    }
    setBusy(true);
    try {
      await request('/studio/' + (setup ? 'setup' : 'login'), writeRequest('POST', { password }));
      onSignIn();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio-access">
      <span className="wordmark-seal" lang="ja" aria-hidden="true">世界</span>
      <h1>Writing studio</h1>
      <p>{setup ? 'Set your password to start writing.' : 'Sign in to manage your journal.'}</p>
      {!hasOwner && !setup ? (
        <p className="form-error" role="status">Set SEKAI_STUDIO_PASSWORD on the server or open the studio from localhost to set up access.</p>
      ) : (
        <form onSubmit={enter} className="studio-form">
          <label>
            Password
            <input value={password} type="password" autoComplete={setup ? 'new-password' : 'current-password'}
              onChange={(event) => setPassword(event.target.value)} required maxLength={256}
              minLength={setup ? 12 : undefined} aria-describedby={setup ? 'password-help' : undefined} />
          </label>
          {setup && (
            <>
              <p id="password-help" className="field-hint">Use at least 12 characters.</p>
              <label>
                Confirm password
                <input value={confirmation} type="password" autoComplete="new-password" required maxLength={256}
                  onChange={(event) => setConfirmation(event.target.value)} />
              </label>
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'Opening studio…' : setup ? 'Set password' : 'Sign in'}
          </button>
        </form>
      )}
    </div>
  );
}

function blankPost(): StudioPost {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return {
    id, slug: '', title: '', excerpt: '', content: '', category: 'Thoughts', tags: [],
    publishedAt: null, japaneseTitle: null, readTime: '1 min read', status: 'draft', revision: 0,
  };
}

function StudioEditor({ initialPosts, onSignOut }: { initialPosts: StudioPost[]; onSignOut: () => void }) {
  const [posts, setPosts] = useState(initialPosts);
  const [post, setPost] = useState<StudioPost>(blankPost);
  const [tags, setTags] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(changes: Partial<StudioPost>) {
    setPost((current) => ({ ...current, ...changes }));
    setDirty(true);
    setNotice('');
  }

  function select(next?: StudioPost) {
    if (next?.id === post.id) return;
    if (dirty && !window.confirm('Discard unsaved changes to this post?')) return;
    setPost(next ?? blankPost());
    setTags(next?.tags.join(', ') ?? '');
    setDirty(false);
    setPreview(false);
    setNotice('');
    setError('');
  }

  async function save(status: PostStatus) {
    setError('');
    setNotice('');
    if (!post.title.trim()) {
      setError('Give the post a title before saving.');
      document.getElementById('post-title')?.focus();
      return;
    }
    if (status === 'published' && (!post.excerpt.trim() || !post.content.trim())) {
      setError('Add a summary and article before publishing.');
      return;
    }

    const labels = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    setBusy(true);
    try {
      const saved = await request<StudioPost>('/studio/posts/' + post.id,
        writeRequest('PUT', { ...post, status, tags: labels }));
      setPost(saved);
      setTags(saved.tags.join(', '));
      setPosts((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setDirty(false);
      if (saved.status === 'published') setNotice(post.status === 'published' ? 'Changes saved.' : 'Post published.');
      else setNotice(post.status === 'published' ? 'Post moved to drafts.' : 'Draft saved.');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (dirty && !window.confirm('Sign out and discard unsaved changes?')) return;
    setBusy(true);
    setError('');
    try {
      await request('/studio/logout', { method: 'POST' });
      onSignOut();
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  const isLive = post.status === 'published';

  return (
    <>
      <div className="studio-heading">
        <h1>Writing studio</h1>
        <button className="button button--outline" type="button" disabled={busy} onClick={() => void signOut()}>Sign out</button>
      </div>
      <div className="studio-grid">
        <aside className="studio-posts" aria-label="Your posts">
          <button className="button studio-new" type="button" disabled={busy} onClick={() => select()}>New post</button>
          <ul>
            {posts.map((item) => (
              <li key={item.id}>
                <button type="button" disabled={busy} onClick={() => select(item)}
                  aria-current={post.id === item.id ? 'true' : undefined}>
                  <span>{item.title}</span>
                  <span className="studio-status">{item.status === 'published' ? 'Published' : 'Draft'}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <form className="studio-editor" onSubmit={(event) => { event.preventDefault(); void save(post.status); }}>
          <div className="editor-heading">
            <h2>{post.revision ? 'Edit post' : 'New post'}</h2>
            {isLive && <a className="text-link" href={articleUrl(post.slug)} target="_blank" rel="noreferrer">View article</a>}
          </div>
          <fieldset className="studio-form" disabled={busy}>
            <label>
              Title
              <input id="post-title" value={post.title} maxLength={160} required onChange={(event) => edit({ title: event.target.value })} />
            </label>
            <div className="editor-details">
              <div>
                <label htmlFor="post-topic">Topic</label>
                <select id="post-topic" value={post.category} onChange={(event) => edit({ category: event.target.value as Topic })}>
                  {TOPICS.map((topic) => <option key={topic}>{topic}</option>)}
                </select>
              </div>
              <label>
                Tags <span className="field-hint">(comma-separated)</span>
                <input value={tags} onChange={(event) => { setTags(event.target.value); setDirty(true); setNotice(''); }} />
              </label>
            </div>
            <label>
              Summary
              <textarea rows={2} value={post.excerpt} maxLength={350} onChange={(event) => edit({ excerpt: event.target.value })} />
            </label>
            <div className="editor-body-heading">
              <label htmlFor={preview ? undefined : 'post-content'}>Article <span className="field-hint">(Markdown)</span></label>
              <div className="editor-toggle" role="group" aria-label="Article editor view">
                <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
                <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
              </div>
            </div>
            {preview ? (
              <div className="editor-preview">{post.content.trim() ? <MarkdownBody content={post.content} /> : <p>Write something to see the preview.</p>}</div>
            ) : (
              <textarea id="post-content" className="editor-text" rows={12} maxLength={100_000}
                value={post.content} onChange={(event) => edit({ content: event.target.value })}
                placeholder="Start writing…" spellCheck />
            )}
            <div className="editor-feedback" aria-live="polite">{notice}</div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="editor-actions">
              {isLive ? (
                <>
                  <button className="button button--outline" type="button" onClick={() => void save('draft')}>Unpublish</button>
                  <button className="button" type="submit">Save changes</button>
                </>
              ) : (
                <>
                  <button className="button button--outline" type="submit">Save draft</button>
                  <button className="button" type="button" onClick={() => void save('published')}>Publish</button>
                </>
              )}
            </div>
          </fieldset>
        </form>
      </div>
    </>
  );
}

function StudioPosts({ onSignOut }: { onSignOut: () => void }) {
  const { data, error, retry } = useResource<StudioPost[]>('/studio/posts');
  if (data) return <StudioEditor initialPosts={data} onSignOut={onSignOut} />;
  return (
    <div className="page-message">
      <p role="status">{error?.message ?? 'Loading your posts…'}</p>
      {error && <button className="button button--outline" onClick={retry}>Try again</button>}
    </div>
  );
}

export default function Studio() {
  const { data, error, retry } = useResource<Session>('/studio/session');
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => { document.title = 'Writing studio · Sekai'; }, []);

  return (
    <main className="page-width studio" id="main-content">
      {data ? (
        (signedIn ?? data.signedIn)
          ? <StudioPosts onSignOut={() => setSignedIn(false)} />
          : <StudioAccess hasOwner={data.hasOwner || signedIn !== null} setupAvailable={data.setupAvailable}
            onSignIn={() => setSignedIn(true)} />
      ) : (
        <div className="page-message">
          <p role="status">{error?.message ?? 'Opening the studio…'}</p>
          {error && <button className="button button--outline" onClick={retry}>Try again</button>}
        </div>
      )}
    </main>
  );
}

