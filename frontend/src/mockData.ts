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

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-3',
    slug: 'kanji-mnemonics-and-associative-memory',
    title: 'Deconstructing 2,136 Jōyō Kanji Through Visual Etymology',
    japaneseTitle: '常用漢字２１３６字の視覚的記憶術',
    kanjiTheme: '記憶',
    excerpt: 'A deep dive into learning the Joyo Kanji by viewing characters not as arbitrary strokes, but as interconnected architectural blueprints of thought.',
    content: `
# Kanji as Ideographic Blueprints

When people first encounter Japanese Kanji, the sheer volume—2,136 characters required for regular daily literacy—can feel insurmountable. But Kanji are not random scribbles. They are modular lego blocks of human observation.

Take the character for World (**世界 - Sekai**):

- **世 (Se / Yo):** Originally represented three tens (30 years)—the span of a generation, time flowing across human ages.
- **界 (Kai):** A field (\`田\`) surrounded by boundaries or people (\`介\`)—the delineation of space.

Combined, **世界** literally translates to: *The span of time meeting the boundary of space*. The entire universe captured in two glyphs.

---

## The Radical Association Framework

Instead of rote repetition (writing a character 50 times on graph paper), modern language acquisition leverages associative memory:

1. **Primitive Decomposition:** Break characters down into their constituent components (e.g. tree \`木\`, sun \`日\`, moon \`月\`).
2. **Emotional Storylines:** Create vivid, bizarre mental narratives connecting the primitives to the character's meaning.
3. **Spaced Repetition Systems (SRS):** Review cards at the exact moment before the memory trace decays.

\`\`\`markdown
Structure:
[Primitive A: Sun 日] + [Primitive B: Horizon 一] = [旦 (Dawn / Morning Sun)]
\`\`\`

By organizing knowledge in this interconnected web, learning 2,000 characters transforms from a chore into an exhilarating puzzle.
    `,
    category: 'Japanese',
    tags: ['Japanese', 'Linguistics', 'Cognition', 'Mnemonics', 'Study Systems'],
    date: 'August 12, 2026',
    readTime: '8 min read',
    featured: true,
    coverGradient: 'from-amber-500/30 via-rose-600/30 to-orange-700/40',
    accentColor: '#e6c875',
  },
];
