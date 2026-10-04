// Pulls anime (MyAnimeList) and game (Steam) data into src/data/generated/.
// Runs before every build; if a source is unreachable the last committed JSON is kept.
import { mkdir, writeFile } from "node:fs/promises";

const MAL_USER = "mus_theballer";
const STEAM_ID = "76561199839140332";
const OUT = new URL("../src/data/generated/", import.meta.url);
const UA = { "User-Agent": "Mozilla/5.0 (portfolio build; github.com/Mustaballer)" };

async function fetchAnime() {
  const list = [];
  for (let offset = 0; ; offset += 300) {
    const res = await fetch(
      `https://myanimelist.net/animelist/${MAL_USER}/load.json?status=7&offset=${offset}`,
      { headers: UA },
    );
    if (!res.ok) throw new Error(`MAL ${res.status}`);
    const page = await res.json();
    list.push(...page);
    if (page.length < 300) break;
  }

  const slim = (a) => ({
    id: a.anime_id,
    title: a.anime_title_eng || a.anime_title,
    score: a.score,
    episodes: a.num_watched_episodes,
    image: a.anime_image_path?.replace(/\/r\/\d+x\d+/, "").split("?")[0],
    url: `https://myanimelist.net/anime/${a.anime_id}`,
    genres: (a.genres ?? []).map((g) => g.name),
    updatedAt: a.updated_at,
  });

  const scored = list.filter((a) => a.score > 0);
  const genreCount = {};
  for (const a of list.filter((a) => a.status === 2)) {
    for (const g of a.genres ?? []) genreCount[g.name] = (genreCount[g.name] ?? 0) + 1;
  }

  return {
    profileUrl: `https://myanimelist.net/profile/${MAL_USER}`,
    fetchedAt: new Date().toISOString(),
    stats: {
      total: list.length,
      completed: list.filter((a) => a.status === 2).length,
      watching: list.filter((a) => a.status === 1).length,
      episodes: list.reduce((n, a) => n + a.num_watched_episodes, 0),
      meanScore: +(scored.reduce((n, a) => n + a.score, 0) / scored.length).toFixed(2),
      topGenres: Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count })),
    },
    hallOfFame: list
      .filter((a) => a.score === 10)
      .sort((a, b) => b.anime_total_members - a.anime_total_members)
      .map(slim),
    watching: list
      .filter((a) => a.status === 1)
      .sort((a, b) => b.updated_at - a.updated_at)
      .map(slim),
  };
}

async function fetchGames() {
  const key = process.env.STEAM_API_KEY;
  const header = (appid) =>
    `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

  // With an API key we get the whole library + playtime; without one, the public profile's recent games.
  if (key) {
    const res = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${STEAM_ID}&include_appinfo=1&format=json`,
    );
    if (!res.ok) throw new Error(`Steam API ${res.status}`);
    const games = (await res.json()).response?.games ?? [];
    return {
      source: "library",
      games: games
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .map((g) => ({
          appid: g.appid,
          name: g.name,
          hours: Math.round(g.playtime_forever / 6) / 10,
          recentHours: Math.round((g.playtime_2weeks ?? 0) / 6) / 10,
          lastPlayed: g.rtime_last_played || null,
          image: header(g.appid),
          url: `https://store.steampowered.com/app/${g.appid}`,
        })),
    };
  }

  const res = await fetch(`https://steamcommunity.com/profiles/${STEAM_ID}/`, { headers: UA });
  if (!res.ok) throw new Error(`Steam profile ${res.status}`);
  const html = await res.text();
  const blocks = html.split('<div class="recent_game"').slice(1);
  return {
    source: "recent",
    games: blocks.map((b) => {
      const appid = Number(b.match(/steamcommunity\.com\/app\/(\d+)/)?.[1]);
      const name = b.match(/class="whiteLink"[^>]*>([^<]+)</)?.[1]?.trim();
      const hours = parseFloat(b.match(/([\d,.]+)\s*hrs on record/)?.[1]?.replace(/,/g, "") ?? "0");
      const last = b.match(/last played on ([^<]+)/i)?.[1]?.trim() ?? null;
      return {
        appid,
        name: name?.replace(/&amp;/g, "&").replace(/&#39;/g, "'"),
        hours,
        lastPlayed: last,
        image: header(appid),
        url: `https://store.steampowered.com/app/${appid}`,
      };
    }).filter((g) => g.appid && g.name),
  };
}

await mkdir(OUT, { recursive: true });
for (const [file, fn] of [["anime.json", fetchAnime], ["games.json", fetchGames]]) {
  try {
    const data = await fn();
    await writeFile(new URL(file, OUT), JSON.stringify(data, null, 2) + "\n");
    console.log(`✓ ${file}`);
  } catch (err) {
    console.warn(`⚠ ${file}: ${err.message} — keeping previous data`);
  }
}
