import { Wordmark } from './Navbar';

export function Footer({ medium }: { medium: string }) {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <Wordmark />
        <p>A personal journal by Swastika.</p>
        {medium && <a href={medium} rel="me">Medium</a>}
        {import.meta.env.MODE !== 'pages' && <a className="footer-studio" href="/studio">Writing studio</a>}
      </div>
    </footer>
  );
}

