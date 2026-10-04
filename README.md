# mustaballer.github.io

Live at **https://mustheballer.com**. My portfolio — a 3D fantasy study you can explore, with a plain "recruiter mode" for the fast version.

- **Study mode:** a Three.js room (React Three Fiber). The quest board holds my experience, the PC runs "MusOS" (projects, anime, games, achievements), and the bookshelf is my library and skill spellbook.
- **Recruiter mode:** the same content as a fast static page. Default on phones and for `prefers-reduced-motion`; force either with `?mode=recruiter` / `?mode=study`.

## Stack
Astro · React · React Three Fiber · drei · deployed to GitHub Pages with Actions.

## Content
- Résumé content: `src/data/profile.ts`
- Anime (MyAnimeList) and games (Steam): fetched by `scripts/fetch-data.mjs` into `src/data/generated/` on every build, and rebuilt nightly. Set a `STEAM_API_KEY` repo secret to show the full Steam library instead of recently played.

## Develop
```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # fetch data + build to dist/
```
