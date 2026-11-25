export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Code' | 'Japanese' | 'Design' | 'Thoughts';
  tags: string[];
  date: string;
  readTime: string;
  japaneseTitle?: string;
  kanjiTheme?: string;
  featured?: boolean;
  coverGradient: string;
  accentColor: string;
}

export interface CategoryInfo {
  id: string;
  name: 'Code' | 'Japanese' | 'Design' | 'Thoughts';
  kanji: string;
  romaji: string;
  description: string;
  iconName: string;
  gradient: string;
  glowColor: string;
  postCount: number;
}

export interface ShikishiQuote {
  id: string;
  kanji: string;
  kana: string;
  english: string;
  meaning: string;
  author: string;
  date: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'code',
    name: 'Code',
    kanji: '電脳',
    romaji: 'Dennō',
    description: 'Crafting digital experiences, WebGL shaders, systems architecture, and modern React patterns.',
    iconName: 'Code2',
    gradient: 'from-pink-500/20 via-lavender-500/20 to-purple-600/30',
    glowColor: 'rgba(242, 120, 153, 0.4)',
    postCount: 8,
  },
  {
    id: 'japanese',
    name: 'Japanese',
    kanji: '日本語',
    romaji: 'Nihongo',
    description: 'Immersion journeys, Kanji mnemonics, classical poetry, and language learning frameworks.',
    iconName: 'Languages',
    gradient: 'from-amber-500/20 via-rose-500/20 to-orange-500/30',
    glowColor: 'rgba(230, 200, 117, 0.4)',
    postCount: 5,
  },
  {
    id: 'design',
    name: 'Design',
    kanji: '意匠',
    romaji: 'Ishō',
    description: 'Spatial UI, 2.5D glassmorphism, micro-interactions, and Ghibli-inspired digital aesthetics.',
    iconName: 'Palette',
    gradient: 'from-purple-500/20 via-fuchsia-500/20 to-pink-500/30',
    glowColor: 'rgba(184, 130, 255, 0.4)',
    postCount: 6,
  },
  {
    id: 'thoughts',
    name: 'Thoughts',
    kanji: '思索',
    romaji: 'Shisaku',
    description: 'Midnight philosophizing, book reflections, creative momentum, and constructive overthinking.',
    iconName: 'Sparkles',
    gradient: 'from-blue-500/20 via-indigo-500/20 to-purple-500/30',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    postCount: 11,
  },
];

export const SHIKISHI_BOARDS: ShikishiQuote[] = [
  {
    id: 'shikishi-1',
    kanji: '一期一会',
    kana: 'いちごいちえ',
    english: 'One time, one meeting.',
    meaning: 'Cherish every encounter, for it may never recur in the exact same way.',
    author: 'Sen no Rikyū',
    date: 'Spring Dawn',
  },
  {
    id: 'shikishi-2',
    kanji: '幽玄の美',
    kana: 'ゆうげんのび',
    english: 'The beauty of subtle grace & mystery.',
    meaning: 'Finding profound wonder in what is hinted at rather than explicitly revealed.',
    author: 'Zeami Motokiyo',
    date: 'Dusk Reflections',
  },
  {
    id: 'shikishi-3',
    kanji: '日々是好日',
    kana: 'ひびこれこうじつ',
    english: 'Every day is a good day.',
    meaning: 'Embracing each moment as complete in itself, through sunshine or rain.',
    author: 'Yunmen Wenyan',
    date: 'Moonrise Meditation',
  },
];
