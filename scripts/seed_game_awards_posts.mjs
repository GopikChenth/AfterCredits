import fs from 'node:fs/promises';
import path from 'node:path';

const GAME_AWARDS_YEARLY_WINNERS = [
  { year: 2025, awards: [
    { label: 'Game of the Year', title: 'Clair Obscur: Expedition 33' },
    { label: 'Best Game Direction', title: 'Clair Obscur: Expedition 33' },
    { label: 'Best Independent Game', title: 'Clair Obscur: Expedition 33' },
    { label: 'Best Multiplayer', title: 'Arc Raiders' },
  ]},
  { year: 2024, awards: [
    { label: 'Game of the Year', title: 'Astro Bot' },
    { label: 'Best Game Direction', title: 'Astro Bot' },
    { label: 'Best Independent Game', title: 'Balatro' },
    { label: 'Best Multiplayer', title: 'Helldivers 2' },
  ]},
  { year: 2023, awards: [
    { label: 'Game of the Year', title: "Baldur's Gate 3" },
    { label: 'Best Game Direction', title: 'Alan Wake 2' },
    { label: 'Best Independent Game', title: 'Sea of Stars' },
    { label: 'Best Multiplayer', title: "Baldur's Gate 3" },
  ]},
  { year: 2022, awards: [
    { label: 'Game of the Year', title: 'Elden Ring' },
    { label: 'Best Game Direction', title: 'Elden Ring' },
    { label: 'Best Independent Game', title: 'Stray' },
    { label: 'Best Multiplayer', title: 'Splatoon 3' },
  ]},
  { year: 2021, awards: [
    { label: 'Game of the Year', title: 'It Takes Two' },
    { label: 'Best Game Direction', title: 'Deathloop' },
    { label: 'Best Independent Game', title: 'Kena: Bridge of Spirits' },
    { label: 'Best Multiplayer', title: 'It Takes Two' },
  ]},
  { year: 2020, awards: [
    { label: 'Game of the Year', title: 'The Last of Us Part II' },
    { label: 'Best Game Direction', title: 'The Last of Us Part II' },
    { label: 'Best Independent Game', title: 'Hades' },
    { label: 'Best Multiplayer', title: 'Among Us' },
  ]},
  { year: 2019, awards: [
    { label: 'Game of the Year', title: 'Sekiro: Shadows Die Twice' },
    { label: 'Best Game Direction', title: 'Death Stranding' },
    { label: 'Best Independent Game', title: 'Disco Elysium' },
    { label: 'Best Multiplayer', title: 'Apex Legends' },
  ]},
  { year: 2018, awards: [
    { label: 'Game of the Year', title: 'God of War' },
    { label: 'Best Game Direction', title: 'God of War' },
    { label: 'Best Independent Game', title: 'Celeste' },
    { label: 'Best Multiplayer', title: 'Fortnite' },
  ]},
  { year: 2017, awards: [
    { label: 'Game of the Year', title: 'The Legend of Zelda: Breath of the Wild' },
    { label: 'Best Game Direction', title: 'The Legend of Zelda: Breath of the Wild' },
    { label: 'Best Independent Game', title: 'Cuphead' },
    { label: 'Best Multiplayer', title: "PlayerUnknown's Battlegrounds" },
  ]},
  { year: 2016, awards: [
    { label: 'Game of the Year', title: 'Overwatch' },
    { label: 'Best Game Direction', title: 'Overwatch' },
    { label: 'Best Independent Game', title: 'Inside' },
    { label: 'Best Multiplayer', title: 'Overwatch' },
  ]},
  { year: 2015, awards: [
    { label: 'Game of the Year', title: 'The Witcher 3: Wild Hunt' },
    { label: 'Best Independent Game', title: 'Rocket League' },
    { label: 'Best Multiplayer', title: 'Splatoon' },
  ]},
  { year: 2014, awards: [
    { label: 'Game of the Year', title: 'Dragon Age: Inquisition' },
    { label: 'Best Independent Game', title: 'Shovel Knight' },
  ]},
];

const envPath = path.resolve('.env');
const envContent = await fs.readFile(envPath, 'utf8');
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  const value = trimmed.slice(eqIndex + 1);
  process.env[key] = value;
}

const {
  EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  EXPO_PUBLIC_RAWG_API_KEY: rawgApiKey,
} = process.env;

if (!supabaseUrl || !supabaseAnonKey || !rawgApiKey) {
  throw new Error('Missing required environment variables in .env');
}

const supabaseHeaders = {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
};

const supabaseJsonHeaders = {
  ...supabaseHeaders,
  'Content-Type': 'application/json',
};

const supabaseRequest = async (pathname, options = {}) => {
  const response = await fetch(`${supabaseUrl}${pathname}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const searchRawg = async (query) => {
  const params = new URLSearchParams({
    key: rawgApiKey,
    search: query,
    page: '1',
    page_size: '5',
    search_precise: 'true',
  });

  const response = await fetch(`https://api.rawg.io/api/games?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RAWG ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data?.results?.[0] || null;
};

const buildPosts = async () => {
  const posts = [];

  for (const entry of GAME_AWARDS_YEARLY_WINNERS) {
    const resolvedAwards = [];
    const mediaCovers = [];
    const seen = new Set();

    for (const award of entry.awards) {
      const game = await searchRawg(award.title);
      const resolvedTitle = game?.name || award.title;
      const imageUrl = game?.background_image || null;
      const mediaId = game?.id || null;

      resolvedAwards.push(`${award.label}: ${resolvedTitle}`);

      const dedupeKey = `${mediaId || 'none'}:${resolvedTitle.toLowerCase()}`;
      if (!seen.has(dedupeKey) && imageUrl) {
        seen.add(dedupeKey);
        mediaCovers.push({
          imageUrl,
          mediaId,
          title: resolvedTitle,
        });
      }
    }

    posts.push({
      username: 'AfterCredits',
      avatar_url: null,
      date: String(entry.year),
      title: `THE GAME AWARDS ${entry.year}`,
      description: resolvedAwards.join('\n'),
      media_covers: mediaCovers,
      media_type: 'games',
    });
  }

  return posts.sort((a, b) => Number(b.date) - Number(a.date));
};

const existingGamePosts = await supabaseRequest('/rest/v1/posts?media_type=eq.games&select=*', {
  headers: supabaseHeaders,
  method: 'GET',
});

const backupDir = path.resolve('.tmp');
await fs.mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `game-posts-backup-${Date.now()}.json`);
await fs.writeFile(backupPath, JSON.stringify(existingGamePosts, null, 2));

const newPosts = await buildPosts();

const insertedPosts = await supabaseRequest('/rest/v1/posts', {
  headers: {
    ...supabaseJsonHeaders,
    Prefer: 'return=representation',
  },
  method: 'POST',
  body: JSON.stringify(newPosts),
});

if (existingGamePosts.length > 0) {
  const ids = existingGamePosts.map((row) => row.id).join(',');
  await supabaseRequest(`/rest/v1/posts?id=in.(${ids})`, {
    headers: supabaseHeaders,
    method: 'DELETE',
  });
}

console.log(JSON.stringify({
  backupPath,
  removedCount: existingGamePosts.length,
  insertedCount: insertedPosts?.length || 0,
  titles: (insertedPosts || []).map((row) => row.title),
}, null, 2));
