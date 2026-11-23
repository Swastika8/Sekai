import type { BlogPost } from '../mockData';

interface SpatialArticleCardProps {
  post: BlogPost;
  onClose?: () => void;
}

export const SpatialArticleCard = ({ post }: SpatialArticleCardProps) => {
  return (
    <div className="relative w-full max-w-5xl mx-auto my-8 px-2 sm:px-4">
      {/* 
        [COMPOSITION & LAYERS]
        Deep Background: Deep magenta & purple atmosphere with celestial moon & surreal mountains (via HeroScene3D).
      */}

      {/* Floating Framing Cards (Repositioned outside the central element) */}
      <div className="hidden lg:block pointer-events-none">
        {/* Top-Left Shikishi Card */}
        <div className="absolute -left-12 -top-8 w-36 p-4 rounded-2xl bg-washi-bg text-stone-900 border border-gold-400/60 shadow-glow-gold rotate-[-6deg] animate-float-slow z-10">
          <div className="text-center space-y-1">
            <span className="font-jp text-lg font-bold">一期一会</span>
            <p className="text-[9px] text-stone-500 font-sans">Once in a lifetime</p>
          </div>
        </div>

        {/* Top-Right Shikishi Card */}
        <div className="absolute -right-12 -top-6 w-36 p-4 rounded-2xl bg-washi-bg text-stone-900 border border-gold-400/60 shadow-glow-gold rotate-[8deg] animate-float-reverse z-10">
          <div className="text-center space-y-1">
            <span className="font-jp text-lg font-bold">幽玄</span>
            <p className="text-[9px] text-stone-500 font-sans">Subtle Grace</p>
          </div>
        </div>

        {/* Bottom-Right Shikishi Card */}
        <div className="absolute -right-10 bottom-16 w-36 p-4 rounded-2xl bg-washi-bg text-stone-900 border border-gold-400/60 shadow-glow-gold rotate-[-4deg] animate-float-slow z-10">
          <div className="text-center space-y-1">
            <span className="font-jp text-lg font-bold">日々是好日</span>
            <p className="text-[9px] text-stone-500 font-sans">Every day is a good day</p>
          </div>
        </div>
      </div>

      {/* 
        [THE KEY NEW ELEMENT]: Central Frosted-Glass Panel 
        (translucent, opaquish white, soft inner blur, rounded corners, outer glow/glassmorphism effect)
      */}
      <div className="relative rounded-[2.5rem] bg-white/[0.78] backdrop-blur-3xl border border-white/80 shadow-[0_0_60px_-10px_rgba(242,120,153,0.35),0_30px_70px_-20px_rgba(7,8,16,0.6)] p-6 sm:p-10 md:p-12 text-stone-900 transition-all duration-500">
        
        {/* Subtle inner decorative rim */}
        <div className="absolute inset-3 rounded-[2rem] border border-white/40 pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200/80">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-xl bg-sakura-500/15 border border-sakura-400/30 text-rose-800 font-jp text-xs font-bold">
              {post.kanjiTheme || '記憶 • 漢字'}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-300 text-stone-600 text-xs font-sans">
              {post.category}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-sans font-semibold text-stone-600 uppercase tracking-widest">
              Spatial Canvas View
            </span>
          </div>
        </div>

        {/* 
          [TEXT ON GLASS PANEL] 
          Title: 'The Radical Association Framework' (top-center) in high contrast dark text
        */}
        <div className="text-center space-y-3 mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-stone-950 tracking-tight">
            {post.slug === 'kanji-mnemonics-and-associative-memory' ? 'The Radical Association Framework' : post.title}
          </h2>
          <p className="text-xs sm:text-sm font-jp text-rose-800 tracking-widest font-semibold">
            {post.japaneseTitle || '常用漢字２１３６字の視覚的記憶術 • Visual Etymology'}
          </p>
        </div>

        {/* Introductory Paragraph */}
        <p className="text-sm sm:text-base font-sans text-stone-800 leading-relaxed max-w-3xl mx-auto mb-8 text-center sm:text-left">
          Instead of rote repetition (writing a character 50 times on graph paper), modern language acquisition leverages associative memory:
        </p>

        {/* 
          Numbered Paragraphs 1, 2, 3 with exact Japanese characters (木, 日, 月)
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-white/60 border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold font-sans">
                1
              </span>
              <h3 className="font-sans font-bold text-sm text-stone-900">
                Primitive Decomposition
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-sans text-stone-700 leading-relaxed">
              Break characters down into their constituent components (e.g. tree <span className="font-jp font-bold text-rose-800 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">`木`</span>, sun <span className="font-jp font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">`日`</span>, moon <span className="font-jp font-bold text-purple-800 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">`月`</span>).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-white/60 border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold font-sans">
                2
              </span>
              <h3 className="font-sans font-bold text-sm text-stone-900">
                Emotional Storylines
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-sans text-stone-700 leading-relaxed">
              Create vivid, bizarre mental narratives connecting the primitives to the character's meaning for long-term neural retention.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-white/60 border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold font-sans">
                3
              </span>
              <h3 className="font-sans font-bold text-sm text-stone-900">
                Spaced Repetition (SRS)
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-sans text-stone-700 leading-relaxed">
              Review cards at the exact algorithmic moment before the memory trace decays to cement subconscious recall.
            </p>
          </div>
        </div>

        {/* 
          [REFINEMENT]: Foreground Distinct Unfrosted Dark Code Box
          (Laptop & code structure displayed distinctly in front)
        */}
        <div className="relative my-8 rounded-2xl overflow-hidden bg-dusk-950 text-pink-100 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="px-4 py-2.5 bg-dusk-900/90 border-b border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 text-slate-200 font-semibold">Source Snippet</span>
            </div>
            <span className="text-sakura-300 font-sans font-medium">TSX / WebGL</span>
          </div>

          {/* Code Body */}
          <div className="p-5 font-mono text-xs sm:text-sm leading-relaxed space-y-2">
            <p className="text-slate-400 font-sans font-semibold">
              Structure:
            </p>
            <p className="text-pink-300 bg-dusk-900/60 p-3 rounded-xl border border-white/5 overflow-x-auto">
              [Primitive A: Sun <span className="font-jp text-amber-300 font-bold">日</span>] + [Primitive B: Horizon <span className="font-jp text-cyan-300 font-bold">一</span>] = [<span className="font-jp text-rose-300 font-bold text-base">旦</span> (Dawn / Morning Sun)]
            </p>
          </div>
        </div>

        {/* Concluding Paragraph */}
        <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm font-sans text-stone-800 text-center sm:text-left leading-relaxed">
            By organizing knowledge in this interconnected web, learning 2,000 characters transforms from a chore into an exhilarating puzzle.
          </p>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-jp text-[10px] font-bold shadow-sm">
              世界
            </div>
            <span className="text-[11px] font-sans font-semibold text-stone-600">
              Sekai Studio
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
