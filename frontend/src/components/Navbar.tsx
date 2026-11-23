import { Search } from 'lucide-react';

export function Wordmark() {
  return (
    <a className="wordmark" href="/" aria-label="Sekai home">
      <span className="wordmark-seal" lang="ja" aria-hidden="true">世界</span>
      <span>Sekai</span>
    </a>
  );
}

export function Navbar({ onSearch }: { onSearch?: () => void }) {
  return (
    <header className={onSearch ? 'site-header site-header--hero' : 'site-header'}>
      <div className="page-width nav-inner">
        <Wordmark />
        <nav aria-label="Main navigation" className="nav-links">
          {onSearch && <a href="#tea-house">Explore</a>}
          <a href={onSearch ? '#journal' : '/#journal'}>Journal</a>
          <a className="nav-topics" href={onSearch ? '#topics' : '/#topics'}>Topics</a>
          {onSearch && (
            <button type="button" className="nav-search" onClick={onSearch} aria-label="Search journal">
              <Search size={18} strokeWidth={1.6} aria-hidden="true" />
              <span>Search</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

