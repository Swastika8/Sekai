interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

export const LoadingScreen = ({ 
  progress = 100, 
  message = "Manifesting 3D Realm..." 
}: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dusk-950/90 backdrop-blur-2xl transition-opacity duration-700">
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-sakura-500/20 via-lavender-500/20 to-peach-500/20 blur-3xl animate-pulse-glow pointer-events-none" />

      {/* Main Kanji Emblem */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="relative flex items-center justify-center w-28 h-28 rounded-3xl bg-dusk-900/80 border border-sakura-300/30 shadow-glow-pink-lg backdrop-blur-xl group">
          {/* Rotating decorative halo ring */}
          <div className="absolute inset-0 rounded-3xl border border-dashed border-sakura-400/40 animate-spin-slow" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sakura-400/20 via-lavender-400/20 to-peach-400/20 blur-md" />

          {/* Kanji */}
          <span className="text-4xl font-jp font-bold text-transparent bg-clip-text bg-gradient-to-b from-sakura-100 via-sakura-200 to-lavender-300 text-glow-sakura select-none">
            世界
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-display font-bold tracking-[0.3em] text-white">
            SEKAI
          </h2>
          <p className="text-xs font-sans tracking-widest text-slate-400 uppercase">
            {message}
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-56 h-1.5 bg-dusk-800/80 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-sakura-400 via-lavender-400 to-peach-400 rounded-full transition-all duration-300 shadow-glow-pink animate-shimmer"
            style={{ 
              width: `${Math.min(100, Math.max(15, progress))}%`,
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};
