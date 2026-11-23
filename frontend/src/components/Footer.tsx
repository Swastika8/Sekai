import { Wordmark } from './Navbar';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <Wordmark />
        <p>A personal journal by Swastika.</p>
        <a className="footer-studio" href="/studio">Writing studio</a>
      </div>
    </footer>
  );
}

