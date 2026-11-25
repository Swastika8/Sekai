import { Wordmark } from './Navbar';
import { useResource } from '../blog';
import { useEffect, useState } from 'react';

export function Footer() {
  const { data } = useResource<{ medium: string }>('/profile');
  const [saved, setSaved] = useState<string>();
  useEffect(() => {
    const refresh = (event: Event) => setSaved((event as CustomEvent<string>).detail);
    window.addEventListener('profile-saved', refresh);
    return () => window.removeEventListener('profile-saved', refresh);
  }, []);
  const medium = saved ?? data?.medium;
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <Wordmark />
        <p>A personal journal by Swastika.</p>
        {medium && <a href={medium} rel="me">Medium</a>}
        <a className="footer-studio" href="/studio">Writing studio</a>
      </div>
    </footer>
  );
}

