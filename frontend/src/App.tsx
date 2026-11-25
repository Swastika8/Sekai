import { lazy, Suspense, useState } from 'react';
import { useMediumProfile, useResource, type PostSummary, type Topic } from './blog';
import { FeaturedPosts } from './components/FeaturedPosts';
import { Footer } from './components/Footer';
import { GardenWalk } from './components/HeroOverlay';
import { Navbar } from './components/Navbar';
import { SearchModal } from './components/SearchModal';

const ArticleView = lazy(() => import('./components/ArticleView'));
const Studio = import.meta.env.MODE === 'pages' ? null : lazy(() => import('./components/Studio'));

function Home({ medium }: { medium: string }) {
  const { data, error, retry } = useResource<PostSummary[]>('/posts');
  const [category, setCategory] = useState<Topic | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <a className="skip-link" href="#journal">Skip to the journal</a>
      <GardenWalk medium={medium} onSearch={() => setSearchOpen(true)}>
        <FeaturedPosts posts={data} category={category} onCategory={setCategory} error={error} onRetry={retry} />
      </GardenWalk>
      {searchOpen && <SearchModal posts={data} onClose={() => setSearchOpen(false)} />}
    </>
  );
}

export default function App() {
  const medium = useMediumProfile();
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const post = /^\/posts\/([^/]+)$/.exec(path);
  const studio = path === '/studio' && Studio !== null;

  if (path === '/') return <Home medium={medium} />;

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <Suspense fallback={<main id="main-content" className="page-width page-message" role="status">Loading Sekai…</main>}>
        {studio && <Studio />}
        {post && <ArticleView slug={post[1]} />}
        {!studio && !post && (
          <main id="main-content" className="page-width page-message">
            <h1>Page not found</h1>
            <a className="button" href="/">Back to Sekai</a>
          </main>
        )}
      </Suspense>
      <Footer medium={medium} />
    </>
  );
}

