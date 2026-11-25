import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Mouse } from 'lucide-react';
import waterfall from '../assets/garden/waterfall.webp';
import maple from '../assets/garden/maple.webp';
import cherryBough from '../assets/garden/cherry-bough.webp';
import pondStill from '../assets/garden/koi-pond.webp';
import pondStillMobile from '../assets/garden/koi-pond-mobile.webp';
import mediumBoard from '../assets/garden/medium-board.webp';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { chapters, initialLights, type GardenController } from './scene/journey';
import './gardenWalk.css';

const Garden = lazy(() => import('./scene/HeroScene3D'));
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function GardenWalk({ medium, onSearch, children }: { medium: string; onSearch: () => void; children: ReactNode }) {
  const walk = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const controls = useRef<GardenController | null>(null);
  const mediumLink = useRef<HTMLAnchorElement>(null);
  const [motion, setMotion] = useState(() => !window.matchMedia(reducedMotionQuery).matches);
  const [ready, setReady] = useState<boolean | null>(null);
  const [chapter, setChapter] = useState(0);
  const [lights, setLights] = useState(initialLights);

  useEffect(() => {
    if (window.scrollY !== 0 || !window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && walk.current?.contains(target)) target.scrollIntoView({ behavior: 'instant' });
  }, []);

  useEffect(() => {
    const preference = window.matchMedia(reducedMotionQuery);
    function onPreference(event: MediaQueryListEvent) {
      setMotion(!event.matches);
    }
    preference.addEventListener('change', onPreference);
    return () => preference.removeEventListener('change', onPreference);
  }, []);

  useEffect(() => {
    const element = walk.current;
    if (!element) return;
    const root: HTMLDivElement = element;
    const anchors = chapters.map(({ id }) => root.querySelector<HTMLElement>('#' + id));
    const mapleImage = root.querySelector<HTMLImageElement>('.garden-image--maple');
    let points: number[] = [];
    let currentChapter = -1;
    let frame = 0;

    function update() {
      frame = 0;
      const scroll = window.scrollY;
      const next = points.findIndex((point) => point > scroll + 1);
      let position = 0;
      if (next > 0) {
        const previous = points[next - 1];
        position = next - 1 + Math.max(0, (scroll - previous) / Math.max(1, points[next] - previous));
      } else if (next === -1) {
        position = chapters.length - 1 + Math.min(1, Math.max(0, (scroll - points.at(-1)!) / (window.innerHeight * 0.38)));
      }
      progress.current = position;
      const index = Math.min(chapters.length - 1, Math.round(position));
      if (currentChapter !== index) {
        currentChapter = index;
        setChapter(index);
      }
      if (mapleImage) {
        const opacity = String(Math.min(1, position));
        if (mapleImage.style.opacity !== opacity) mapleImage.style.opacity = opacity;
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function measure() {
      const scroll = window.scrollY;
      points = anchors.map((anchor) => (anchor?.getBoundingClientRect().top ?? 0) + scroll);
      schedule();
    }
    const sizes = new ResizeObserver(measure);
    sizes.observe(root);
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(frame);
      sizes.disconnect();
    };
  }, [motion, ready]);

  const interactive = motion && ready === true;

  return (
    <div className="garden-walk" ref={walk} data-chapter={chapters[chapter].id}>
      <div className="garden-backdrop">
        <img className="garden-image" src={waterfall} alt="" fetchPriority="high" />
        {motion && ready !== true && <img className="garden-image garden-image--maple" src={maple} alt="" decoding="async" />}
        {(!motion || ready === false) && <img className="garden-bough" src={cherryBough} alt="" decoding="async" />}
        {motion && (
          <Suspense fallback={null}>
            <Garden progress={progress} controlsRef={controls} mediumLink={mediumLink} onReady={setReady} onLights={setLights} />
          </Suspense>
        )}
        <div className="garden-shade" aria-hidden="true" />
      </div>
      <Navbar onSearch={onSearch} />

      <main className="garden-content">
        <section id="waterfall" className="garden-hero" aria-labelledby="garden-title">
          <div className="page-width garden-layout">
            <div className="garden-copy">
              <p className="eyebrow hero-kicker">A personal journal</p>
              <h1 id="garden-title">A small corner<br /><em>of the world.</em></h1>
              <p className="hero-description">Things I learn, build, think about, and occasionally overthink.</p>
              <div className="garden-actions">
                <a className="hero-button" href="#journal">Read the journal</a>
                <a className="garden-link" href="#tea-house">Explore the garden</a>
              </div>
            </div>
            <div className="garden-hint">
              <Mouse size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>{interactive ? 'Scroll to explore · Drag to look around' : 'Scroll to explore the garden'}</span>
            </div>
          </div>
        </section>

        <section id="tea-house" className="garden-chapter garden-chapter--house" aria-labelledby="tea-house-title">
          <div className="page-width chapter-layout">
            <div className="chapter-copy">
              <h2 id="tea-house-title">The tea house.</h2>
              {interactive && (
                <div className="garden-actions">
                  <button className="garden-button" type="button" onClick={() => controls.current?.activate('house')}>
                    {lights.house ? 'Dim the shoji lights' : 'Light the shoji'}
                  </button>
                  <button className="garden-link" type="button" onClick={() => controls.current?.activate('maple')}>Shake the maple</button>
                </div>
              )}
              <a className="tea-sign" ref={mediumLink} href={medium || undefined} hidden={!medium}
                target="_blank" rel="me noopener noreferrer" aria-label="Read Swastika’s writing on Medium (opens in a new tab)">
                <img src={mediumBoard} alt="Swastika’s writing on Medium" width="816" height="336" />
              </a>
            </div>
          </div>
        </section>

        <section id="lantern-gate" className="garden-chapter" aria-labelledby="gate-title">
          <div className="page-width chapter-layout">
            <div className="chapter-copy">
              <h2 id="gate-title">The lantern path.</h2>
              <div className="garden-actions">
                {interactive && (<>
                  <button className="garden-button" type="button" onClick={() => controls.current?.activate('gate')}>
                    {lights.gate ? 'Dim the lanterns' : 'Light the path'}
                  </button>
                  <button className="garden-link" type="button" onClick={() => controls.current?.activate('sakura')}>Scatter cherry blossoms</button>
                </>)}
                <a className="garden-link" href="#journal">Continue to the journal</a>
              </div>
            </div>
          </div>
        </section>

        <div className="home-content">
          {children}
          <div className="page-width journal-continue">
            <a className="garden-button" href="#moon-pond">Continue to the moon pond</a>
          </div>
        </div>

        <section id="moon-pond" className="garden-chapter garden-chapter--pond" aria-labelledby="pond-title">
          {(!motion || ready !== true) && (
            <picture className="pond-still">
              <source media="(max-width: 650px)" srcSet={pondStillMobile} />
              <img src={pondStill} alt="Patterned koi swim among petals in a moonlit garden pond." loading="lazy" decoding="async" />
            </picture>
          )}
          <div className="page-width chapter-layout">
            <div className="chapter-copy">
              <h2 id="pond-title">The moon pond.</h2>
              <div className="garden-actions">
                {interactive && <button className="garden-button" type="button" onClick={() => controls.current?.activate('pond')}>Send a ripple</button>}
                <a className="garden-link" href="#waterfall">Back to the waterfall</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <nav className="garden-chapters" aria-label="Garden chapters">
        {chapters.map(({ id, name }, index) => (
          <a href={'#' + id} key={id} aria-current={chapter === index ? 'location' : undefined}>
            <span>{name}</span><i aria-hidden="true" />
          </a>
        ))}
      </nav>
      <Footer medium={medium} />
    </div>
  );
}

