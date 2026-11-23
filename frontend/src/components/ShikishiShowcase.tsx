import { useState } from 'react';
import { Scroll, Heart } from 'lucide-react';
import { SHIKISHI_BOARDS, type ShikishiQuote } from '../mockData';

export const ShikishiShowcase = () => {
  const [activeBoard, setActiveBoard] = useState<ShikishiQuote>(SHIKISHI_BOARDS[0]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="philosophies" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-4 md:space-y-0">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-peach-500/10 border border-peach-400/20 text-peach-300 text-xs font-medium">
            <Scroll className="w-3.5 h-3.5" />
            <span>Tactile Musings • 色紙の詩</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-wide">
            Floating Shikishi Boards
          </h2>
          <p className="text-sm font-sans text-slate-400 max-w-md">
            Washi poetry boards floating in the 3D space, carrying time-tested idioms of presence, subtlety, and daily wonder.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-jp tracking-widest self-start md:self-end">
          金箔と和紙の思索
        </div>
      </div>

      {/* 3 Shikishi Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {SHIKISHI_BOARDS.map((board) => {
          const isSelected = activeBoard.id === board.id;
          const isFavorited = liked[board.id];

          return (
            <div
              key={board.id}
              onClick={() => setActiveBoard(board)}
              className={`relative flex flex-col justify-between p-7 rounded-3xl cursor-pointer transition-all duration-500 transform hover:-translate-y-2.5 ${
                isSelected
                  ? 'bg-washi-bg text-dusk-950 shadow-glow-gold ring-2 ring-gold-400 scale-[1.02]'
                  : 'bg-washi-card text-dusk-900 border border-gold-400/40 hover:shadow-xl'
              }`}
            >
              {/* Gold leaf foil border line */}
              <div className="absolute inset-2 rounded-2xl border-2 border-gold-500/60 pointer-events-none" />
              <div className="absolute inset-3 rounded-xl border border-dashed border-gold-400/30 pointer-events-none" />

              <div className="relative z-10">
                {/* Header: Date + Red Hanko Seal */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-sans font-semibold tracking-widest text-stone-500 uppercase">
                    {board.date}
                  </span>

                  {/* Japanese Hanko Seal */}
                  <div className="w-8 h-8 rounded bg-rose-600 border border-rose-800 flex items-center justify-center shadow-sm">
                    <span className="font-jp text-[10px] text-white font-bold">
                      世界
                    </span>
                  </div>
                </div>

                {/* Main Calligraphy Kanji */}
                <div className="text-center my-6 space-y-1">
                  <h3 className="font-jp font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-wider">
                    {board.kanji}
                  </h3>
                  <p className="font-jp text-xs text-rose-700 tracking-widest font-medium">
                    {board.kana}
                  </p>
                </div>

                {/* English Translation */}
                <div className="bg-stone-100/90 rounded-xl p-3.5 my-4 border border-stone-200">
                  <p className="font-serif italic text-sm text-stone-800 text-center font-medium">
                    "{board.english}"
                  </p>
                </div>

                {/* Deeper Meaning */}
                <p className="text-xs font-sans text-stone-600 leading-relaxed text-center">
                  {board.meaning}
                </p>
              </div>

              {/* Footer: Author & Bookmark heart */}
              <div className="relative z-10 pt-5 mt-4 border-t border-stone-300/80 flex items-center justify-between">
                <span className="text-[11px] font-sans font-semibold text-stone-500">
                  — {board.author}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(board.id);
                  }}
                  className={`p-1.5 rounded-full transition-colors ${
                    isFavorited ? 'text-rose-600 bg-rose-100' : 'text-stone-400 hover:text-rose-500'
                  }`}
                  title="Favorite Quote"
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
