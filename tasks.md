# Tasks - Sekai (世界) Blogging Platform

Persistent source of truth for tracking the implementation of Sekai's 3D Cinematic Hybrid Blog Platform.

## Core Infrastructure
- [x] Create root `.gitignore`
- [x] Create empty `backend/` directory
- [x] Scaffold `frontend/` with React + TypeScript (Vite)
- [x] Install dependencies: `@splinetool/react-spline`, `@splinetool/runtime`, `gsap`, `lucide-react`, `three`, `@types/three`, `clsx`, `tailwind-merge`, `tailwindcss`, `autoprefixer`, `postcss`
- [x] Configure Tailwind CSS, fonts (`Cinzel Decorative`, `Outfit`, `Playfair Display`, `Noto Serif JP`), and custom glassmorphism styles in `index.css`

## Mock Data & State
- [x] Include the Jōyō Kanji starter article, four journal categories, and Shikishi quotes in `frontend/src/mockData.ts`

## 3D Scene Architecture (`HeroScene3D.tsx`)
- [x] Strict z-index stacking context: `fixed inset-0 -z-10` canvas with negative depth layer
- [x] `<Suspense>` & custom `LoadingScreen.tsx` with animated 「世界」 kanji crest
- [x] Spline & Three.js 3D hybrid canvas rendering:
  - [x] **Background Layer**: Dreamy dusk/sunrise pastel gradient backdrop, glowing celestial Moon orb with emissive halo & point light, Mountain silhouettes, Clouds (drift UP on scroll UP), Waterfall cascade (flows DOWN on scroll DOWN)
  - [x] **Midground Layer**: Translucent mist planes, 3 Japanese Shikishi poetry boards with washi texture & gold trim drifting/rotating in 3D, High-density glowing pink particle emitter
  - [x] **Foreground Layer**: Floating wooden desk angled ~15° on Y axis, pastel purplish-pink laptop (`#D9A8E0` -> `#F2C6D9`) with pulsating screen light emission (0.4 ↔ 0.9), floating book stack with idle hover bob, peach mug with rising steam particles, potted bonsai plant, ambient dust motes
- [x] Mouse parallax across 3 depth planes (Foreground = fast, Midground = moderate, Background = slow)
- [x] Idle camera breathing motion
- [x] GSAP ScrollTrigger sync binding scroll direction to cloud ascent and waterfall downward cascade

## UI Components & Pages
- [x] `Navbar.tsx`: Floating glassmorphic header with 「世界」 Kanji logo, navigation links, category dropdown, search bar, and ambient sound/music toggle
- [x] `HeroOverlay.tsx`: Hero typography ("SEKAI / 世界", "things I learn, build, think about & occasionally overthink."), quick stats pill, and scroll down indicator
- [x] Show published journal entries in `FeaturedPosts.tsx` with flat cards, topic filters, and reading times
- [x] `CategoryGrid.tsx`: 4 distinct visual blocks (Code, Japanese, Design, Thoughts) with custom gradients and Lucide icons
- [x] `ArticleView.tsx`: Distraction-free reading view with narrow max-width, reading progress bar, table of contents, elegant typography, and "Back to Sekai" navigation
- [x] `Footer.tsx`: Dreamy Japanese footer with seal mark (落款), newsletter signup, and social links

## Verification & Polish
- [x] Build verification (`npm run build`)
- [x] Interactive browser validation with `browser_subagent`
- [x] Record browser video artifact showcasing mouse parallax, scroll triggers, category filtering, and article reader mode
