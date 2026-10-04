// Content sections shared by recruiter mode (rendered to static HTML by Astro)
// and the 3D study's panels. Keep these free of hooks/browser APIs.
import {
  archive,
  education,
  experience,
  hackathons,
  library,
  profile,
  projects,
  RANKS,
  skills,
  training,
} from "../data/profile";
import anime from "../data/generated/anime.json";
import games from "../data/generated/games.json";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Links({ compact = false }: { compact?: boolean }) {
  const l = profile.links;
  return (
    <ul className={`links ${compact ? "links--compact" : ""}`}>
      <li><a href={profile.resume} {...ext}>Résumé (PDF)</a></li>
      <li><a href={l.linkedin} {...ext}>LinkedIn</a></li>
      <li><a href={l.github} {...ext}>GitHub</a></li>
      <li><a href={l.devpost} {...ext}>Devpost</a></li>
      <li><a href={`mailto:${profile.email}`}>{profile.email}</a></li>
    </ul>
  );
}

export function QuestLog() {
  return (
    <div className="quests">
      {experience.map((q) => (
        <article key={q.company + q.start} className={`quest ${q.active ? "quest--active" : ""}`}>
          <header className="quest__head">
            <span className={`quest__rank rank-${q.rank}`} aria-label={`Rank ${q.rank} quest`}>
              {q.rank}
            </span>
            <div>
              <h3>
                {q.role} <span className="at">@ {q.company}</span>
              </h3>
              <p className="meta">
                {q.start} – {q.end} · {q.location}
                {q.active ? <span className="pill pill--live">In progress</span> : <span className="pill">Completed</span>}
              </p>
            </div>
          </header>
          <p className="quest__highlight">{q.highlight}</p>
          <ul className="bullets">
            {q.bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
          <ul className="tags">
            {q.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function Achievements() {
  return (
    <ul className="achievements">
      {experience.map((q) => (
        <li key={q.company + q.start} className={q.active ? "is-active" : ""}>
          <span className="achievements__icon" aria-hidden>🏆</span>
          <div>
            <strong>{q.achievement}</strong>
            <span>{q.role} @ {q.company} · {q.start} – {q.end}</span>
            <em>{q.highlight}</em>
          </div>
        </li>
      ))}
      {hackathons.filter((h) => h.win).map((h) => (
        <li key={h.project}>
          <span className="achievements__icon" aria-hidden>🥇</span>
          <div>
            <strong>{h.event}</strong>
            <span>{h.result} · {h.project}</span>
            <em>Hackathon winner</em>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Hackathons() {
  const wins = hackathons.filter((h) => h.win).length;
  return (
    <div className="trophies">
      <p className="trophies__count">
        <strong>{wins}</strong> hackathon wins · <a href={profile.links.devpost} {...ext}>all projects on Devpost ↗</a>
      </p>
      <ul className="trophies__list">
        {hackathons.map((h) => (
          <li key={h.project} className={`trophy ${h.win ? "trophy--win" : ""}`}>
            <span className="trophy__icon" aria-hidden>{h.win ? "🏆" : "🎖️"}</span>
            <div>
              <h3>{h.project}</h3>
              <p className="trophy__result">{h.result} <span className="meta">· {h.event}</span></p>
              <p className="trophy__blurb">{h.blurb}</p>
              <ul className="tags">{h.tags.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="project__links">
                <a href={h.devpost} {...ext}>Devpost ↗</a>
                {h.github && <a href={h.github} {...ext}>GitHub ↗</a>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Projects() {
  return (
    <>
      <div className="projects">
        {projects.map((p) => (
          <article key={p.name} className={`card project ${p.origin ? "project--origin" : ""}`}>
            {p.badge && <span className="pill project__badge">{p.badge}</span>}
            <h3>{p.name}</h3>
            <p className="project__blurb">{p.blurb}</p>
            <ul className="bullets">
              {p.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <ul className="tags">
              {p.tags.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <p className="project__links">
              {p.links.map((l) => (
                <a key={l.href} href={l.href} {...ext}>{l.label} ↗</a>
              ))}
            </p>
          </article>
        ))}
      </div>
      <details className="archive">
        <summary>Side quests from the early days</summary>
        <ul>
          {archive.map((a) => (
            <li key={a.name}>
              <a href={a.href} {...ext}>{a.name}</a> <span>— {a.note}</span>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

export function Spellbook() {
  return (
    <div className="spellbook">
      {skills.map((school) => (
        <section key={school.school} className="tome" style={{ ["--tome" as string]: school.color }}>
          <h3>{school.school}</h3>
          <ul>
            {school.spells.map((s) => (
              <li key={s.name}>
                <span>{s.name}</span>
                <span className="spell-rank" title={`${s.rank} tier`}>
                  <span className="pips" aria-hidden>
                    {RANKS.slice(0, 5).map((r, i) => (
                      <i key={r} className={i <= RANKS.indexOf(s.rank) ? "on" : ""} />
                    ))}
                  </span>
                  {s.rank}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function Education() {
  return (
    <div className="card education">
      <h3>{education.school}</h3>
      <p>{education.degree}</p>
      <p className="meta">Graduated {education.graduated}</p>
    </div>
  );
}

export function Library() {
  return (
    <div className="library">
      {library.map((b) => (
        <article key={b.title} className="book" style={{ ["--spine" as string]: b.spine }}>
          <a href={b.href} {...ext} className="book__cover" aria-label={`${b.title} on Open Library`}>
            <img src={b.cover} alt="" loading="lazy" width={180} height={276} />
          </a>
          <div>
            <span className="pill">{b.status}</span>
            <h3>{b.title}</h3>
            <p className="meta">{b.author}{b.edition ? ` · ${b.edition}` : ""}</p>
            {b.quote && <blockquote>“{b.quote}”</blockquote>}
          </div>
        </article>
      ))}
    </div>
  );
}

export function Anime({ limit }: { limit?: number }) {
  const s = anime.stats;
  return (
    <div className="anime">
      <dl className="stats">
        <div><dt>Episodes watched</dt><dd>{s.episodes.toLocaleString("en-US")}</dd></div>
        <div><dt>Completed</dt><dd>{s.completed}</dd></div>
        <div><dt>Mean score</dt><dd>{s.meanScore}</dd></div>
        <div><dt>Top genres</dt><dd className="small">{s.topGenres.slice(0, 3).map((g) => g.name).join(" · ")}</dd></div>
      </dl>
      <h3 className="sub">Hall of Fame <span className="meta">— rated 10/10</span></h3>
      <ul className="covers">
        {anime.hallOfFame.slice(0, limit).map((a) => (
          <li key={a.id}>
            <a href={a.url} {...ext} title={a.title}>
              <img src={a.image} alt="" loading="lazy" width={225} height={318} />
              <span>{a.title}</span>
            </a>
          </li>
        ))}
      </ul>
      {anime.watching.length > 0 && (
        <>
          <h3 className="sub">Currently watching</h3>
          <ul className="chips">
            {anime.watching.map((a) => (
              <li key={a.id}><a href={a.url} {...ext}>{a.title}</a></li>
            ))}
          </ul>
        </>
      )}
      <p className="meta">
        Synced from <a href={anime.profileUrl} {...ext}>MyAnimeList</a>.
      </p>
    </div>
  );
}

export function Games() {
  return (
    <div className="games">
      <ul className="game-list">
        {games.games.slice(0, 8).map((g) => (
          <li key={g.appid}>
            <a href={g.url} {...ext}>
              <img src={g.image} alt="" loading="lazy" width={460} height={215} />
              <span className="game-list__name">{g.name}</span>
              <span className="meta">
                {g.hours} hrs on record{g.lastPlayed ? ` · last played ${g.lastPlayed}` : ""}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="meta">
        {games.source === "recent" ? "Recently played, synced" : "Synced"} from{" "}
        <a href={profile.links.steam} {...ext}>Steam</a>.
      </p>
    </div>
  );
}

// "10'2\"" -> inches
const toInches = (h: string) => {
  const m = h.match(/(d+)'s*(d+)?/);
  return m ? Number(m[1]) * 12 + Number(m[2] ?? 0) : null;
};

export function Training() {
  const { goal, plays, watches } = training;
  const now = goal.currentTouch ? toInches(goal.currentTouch) : null;
  const pct = now ? Math.min(100, Math.round((now / 120) * 100)) : null;
  return (
    <div className="training">
      <article className="card training__goal">
        <span className="pill pill--live">Current quest</span>
        <h3>{goal.title}</h3>
        <p>{goal.detail}</p>
        {pct !== null ? (
          <div className="training__bar" role="img" aria-label={`${goal.currentTouch} of 10 feet`}>
            <span style={{ width: `${pct}%` }} />
            <em>{goal.currentTouch} / 10'0"</em>
          </div>
        ) : null}
        <p className="meta">Deadline: {goal.deadline}</p>
      </article>
      <ul className="training__list">
        {plays.map((p) => (
          <li key={p.sport}>
            <span aria-hidden>{p.icon}</span>
            <div><strong>{p.sport}</strong> <span className="meta">· plays</span><p>{p.note}</p></div>
          </li>
        ))}
        <li>
          <span aria-hidden>{watches.icon}</span>
          <div><strong>{watches.sport}</strong> <span className="meta">· watches</span><p>{watches.note}</p></div>
        </li>
      </ul>
    </div>
  );
}

export function Contact() {
  return (
    <div className="contact">
      <p>
        Open to conversations about GenAI agents, developer tooling, and anything shipped to real users.
        The fastest way to reach me is email.
      </p>
      <Links />
    </div>
  );
}
