import { Code2, Languages, Palette, Sparkles, ArrowUpRight, FolderHeart } from 'lucide-react';
import { CATEGORIES } from '../mockData';

interface CategoryGridProps {
  onSelectCategory: (categoryName: string) => void;
  selectedCategory?: string | null;
}

export const CategoryGrid = ({ 
  onSelectCategory,
  selectedCategory 
}: CategoryGridProps) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Code2':
        return <Code2 className="w-6 h-6 text-sakura-300" />;
      case 'Languages':
        return <Languages className="w-6 h-6 text-amber-300" />;
      case 'Palette':
        return <Palette className="w-6 h-6 text-purple-300" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-indigo-300" />;
      default:
        return <Sparkles className="w-6 h-6 text-sakura-300" />;
    }
  };

  return (
    <section id="categories" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 scroll-mt-20">
      {/* Section Title */}
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-lavender-500/10 border border-lavender-400/20 text-lavender-300 text-xs font-medium">
          <FolderHeart className="w-3.5 h-3.5" />
          <span>Spheres of Curiosity • 四つの領域</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-wide">
          Domains of Exploration
        </h2>
        <p className="text-sm font-sans text-slate-400">
          Four distinct avenues of study, practice, aesthetic expression, and constructive reflection.
        </p>
      </div>

      {/* 4 Distinct Visual Gradient Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl cursor-pointer transition-all duration-500 transform hover:-translate-y-2 ${
                isSelected
                  ? 'glass-panel-glow border-sakura-400/60 shadow-glow-pink-lg scale-[1.02]'
                  : 'glass-panel hover:glass-panel-glow border-white/10 hover:border-white/20'
              }`}
            >
              {/* Vibrant Background Gradient Overlay */}
              <div 
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${cat.gradient} opacity-40 group-hover:opacity-80 transition-opacity duration-500 -z-10`} 
              />

              <div>
                {/* Header: Icon + Kanji Emblem */}
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3.5 rounded-2xl bg-dusk-900/80 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {getIcon(cat.iconName)}
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-jp font-bold text-xl text-white/90 group-hover:text-sakura-200 transition-colors">
                      {cat.kanji}
                    </span>
                    <span className="text-[10px] font-sans text-slate-400 tracking-widest uppercase">
                      {cat.romaji}
                    </span>
                  </div>
                </div>

                {/* Category Name */}
                <h3 className="text-xl font-display font-bold text-white group-hover:text-sakura-100 transition-colors mb-2">
                  {cat.name}
                </h3>

                {/* Description */}
                <p className="text-xs font-sans text-slate-300/80 leading-relaxed mb-6">
                  {cat.description}
                </p>
              </div>

              {/* Bottom Row: Post Count Badge + Arrow Action */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200">
                  {cat.postCount} articles
                </span>

                <div className="flex items-center space-x-1 text-xs text-sakura-300 group-hover:text-white font-medium">
                  <span>Explore</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
