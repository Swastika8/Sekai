import { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { formatDate, RequestError, useResource, type Post } from '../blog';
import { PostCover } from './FeaturedPosts';
import { MarkdownBody } from './MarkdownBody';

function Reader({ post }: { post: Post }) {
  const body = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLDivElement>(null);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    document.title = post.title + ' · Sekai';
    if (!indicator.current || !body.current) return;
    const progress = indicator.current;
    const article = body.current;

    function update() {
      const distance = Math.max(1, article.getBoundingClientRect().bottom + window.scrollY - window.innerHeight);
      progress.style.transform = 'scaleX(' + Math.min(1, window.scrollY / distance) + ')';
    }

    const sizes = new ResizeObserver(update);
    sizes.observe(article);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', update);
      sizes.disconnect();
    };
  }, [post.title]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage('Link copied');
    } catch {
      setShareMessage('Copy the URL from your address bar.');
    }
  }

  return (
    <main id="main-content" className="article-page">
      <div className="reading-progress" ref={indicator} aria-hidden="true" />
      <article className="reader" ref={body}>
        <a className="text-link back-link" href="/#journal">Back to the journal</a>
        <header className="reader-header">
          <p className="post-meta">
            <span className="post-topic">{post.category}</span>
            {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
            <span>{post.readTime}</span>
          </p>
          <h1>{post.title}</h1>
          {post.japaneseTitle && <p className="reader-subtitle" lang="ja">{post.japaneseTitle}</p>}
          <p className="reader-excerpt">{post.excerpt}</p>
          <div className="reader-byline">
            <span className="reader-author"><span className="author-seal" lang="ja" aria-hidden="true">世</span>Swastika</span>
            <button className="button button--outline" type="button" onClick={() => void copyLink()}>
              {shareMessage === 'Link copied' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
              {shareMessage === 'Link copied' ? 'Link copied' : 'Copy link'}
            </button>
          </div>
          <span className="visually-hidden" role="status">{shareMessage}</span>
        </header>
        <PostCover topic={post.category} eager />
        <MarkdownBody content={post.content} />
        {post.tags.length > 0 && <ul className="article-tags" aria-label="Article tags">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
      </article>
      <div className="reader reader-end"><a className="text-link" href="/#journal">Back to the journal</a></div>
    </main>
  );
}

export default function ArticleView({ slug }: { slug: string }) {
  const { data, error, retry } = useResource<Post>('/posts/' + slug);
  if (data) return <Reader post={data} />;
  if (error instanceof RequestError && error.status === 404) {
    return (
      <main className="page-width page-message" id="main-content">
        <h1>Article not found</h1>
        <a className="button" href="/#journal">Back to the journal</a>
      </main>
    );
  }
  return (
    <main className="page-width page-message" id="main-content">
      <p role="status">{error?.message ?? 'Loading article…'}</p>
      {error && <button className="button button--outline" onClick={retry}>Try again</button>}
    </main>
  );
}

