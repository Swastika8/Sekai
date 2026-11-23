import { articleUrl, formatDate, TOPICS, type PostSummary, type Topic } from '../blog';
import covers from '../assets/garden/journal-covers.webp';

export function PostCover({ topic, eager = false }: { topic: Topic; eager?: boolean }) {
  return (
    <div className={'post-cover post-cover--' + topic.toLowerCase()} aria-hidden="true">
      <img src={covers} alt="" width="1024" height="1536" loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </div>
  );
}

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="post-card">
      <a href={articleUrl(post.slug)}>
        <PostCover topic={post.category} />
        <div className="post-card-body">
          <p className="post-meta">
            <span className="post-topic">{post.category}</span>
            {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
            <span>{post.readTime}</span>
          </p>
          <h3>{post.title}</h3>
          <p className="post-excerpt">{post.excerpt}</p>
        </div>
      </a>
    </article>
  );
}

interface FeaturedPostsProps {
  posts: PostSummary[] | null;
  category: Topic | null;
  onCategory: (topic: Topic | null) => void;
  error: Error | null;
  onRetry: () => void;
}

export function FeaturedPosts({ posts, category, onCategory, error, onRetry }: FeaturedPostsProps) {
  const visible = posts?.filter((post) => !category || post.category === category) ?? [];

  return (
    <section id="journal" className="journal" aria-labelledby="journal-title">
      <div className="page-width journal-inner">
        <div className="journal-heading">
          <h2 id="journal-title">The journal<span>.</span></h2>
          <p>Notes on code, craft, Japanese, and the things in between.</p>
        </div>

        <div id="topics" className="journal-tools">
          <div className="topic-filters" role="group" aria-label="Filter journal by topic">
            <button type="button" aria-pressed={category === null} onClick={() => onCategory(null)}>All posts</button>
            {TOPICS.map((topic) => (
              <button type="button" key={topic} aria-pressed={category === topic} onClick={() => onCategory(topic)}>{topic}</button>
            ))}
          </div>
          {posts && <p className="journal-count" role="status">{visible.length} {visible.length === 1 ? 'entry' : 'entries'}</p>}
        </div>

        {error && (
          <div className="journal-message" role="alert">
            <p>{error.message}</p>
            <button className="button button--outline" onClick={onRetry}>Try again</button>
          </div>
        )}
        {!posts && !error && <p className="journal-message" role="status">Loading the journal…</p>}
        {posts && visible.length === 0 && <p className="journal-message">{category ? 'No posts in this topic yet.' : 'The journal is empty for now.'}</p>}
        <div className="post-grid">{visible.map((post) => <PostCard key={post.id} post={post} />)}</div>
      </div>
    </section>
  );
}

