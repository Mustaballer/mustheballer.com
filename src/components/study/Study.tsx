import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { battlestation, profile } from "../../data/profile";
import {
  Achievements,
  Anime,
  Contact,
  Education,
  Games,
  Hackathons,
  Library,
  Links,
  Projects,
  QuestLog,
  Spellbook,
} from "../sections";
import type { SpotId } from "./spots";
import { SPOTS } from "./spots";
import "./study.css";

// three.js only downloads when someone actually enters the study.
const Scene = lazy(() => import("./Scene"));

const readMode = () => document.documentElement.dataset.mode ?? "recruiter";

export default function Study() {
  const [mode, setMode] = useState(readMode);
  useEffect(() => {
    const on = () => setMode(readMode());
    window.addEventListener("modechange", on);
    return () => window.removeEventListener("modechange", on);
  }, []);
  if (mode !== "study") return null;
  return <StudyRoom />;
}

function useNight() {
  const get = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : true; // the study defaults to night
  };
  const [night, setNight] = useState(get);
  const toggle = useCallback(() => {
    setNight((n) => {
      const next = !n;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);
  return [night, toggle] as const;
}

function StudyRoom() {
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState<SpotId | null>(null);
  const [panel, setPanel] = useState<SpotId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cast, setCast] = useState(0); // bumps to replay the magic-circle transition
  const [night, toggleNight] = useNight();
  const toastTimer = useRef<number>(undefined);

  const say = useCallback((text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3800);
  }, []);

  const select = useCallback(
    (id: SpotId) => {
      const spot = SPOTS[id];
      if (spot.action === "night") return toggleNight();
      if (spot.toast) say(spot.toast);
      if (!spot.view) return;
      setCast((c) => c + 1);
      setPanel(null);
      setFocus(spot.focusAs ?? id);
      window.setTimeout(() => setPanel(spot.panel ?? id), 650);
    },
    [say, toggleNight],
  );

  const close = useCallback(() => {
    setPanel(null);
    setFocus(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const leave = () => {
    document.documentElement.dataset.mode = "recruiter";
    try { localStorage.setItem("mode", "recruiter"); } catch {}
    window.dispatchEvent(new CustomEvent("modechange", { detail: "recruiter" }));
  };

  return (
    <div className={`study ${night ? "is-night" : "is-day"}`}>
      <Suspense fallback={null}>
        <Scene focus={focus} night={night} onSelect={select} onReady={() => setReady(true)} />
      </Suspense>

      <Boot done={ready} />
      {cast > 0 && <MagicCircle key={cast} />}

      <header className="hud hud--top">
        <div className="hud__id">
          <strong>{profile.name}</strong>
          <span>{profile.title} @ {profile.company} · {profile.location}</span>
        </div>
        <div className="hud__actions">
          <button type="button" className="hud-btn" onClick={toggleNight} aria-label="Toggle day and night">
            {night ? "☀ Day" : "☾ Night"}
          </button>
          <a className="hud-btn" href={profile.resume} target="_blank" rel="noopener noreferrer">Résumé</a>
          <button type="button" className="hud-btn hud-btn--accent" onClick={leave}>
            Recruiter mode
          </button>
        </div>
      </header>

      <nav className="hud hud--travel" aria-label="Quick travel">
        <span className="hud__label">Quick travel</span>
        {(["board", "monitor", "trophies", "shelf", "diploma", "phone"] as SpotId[]).map((id) => (
          <button key={id} type="button" className={focus === id ? "is-on" : ""} onClick={() => select(id)}>
            {SPOTS[id].label}
          </button>
        ))}
      </nav>

      {!focus && ready && <p className="hud hud--hint">Click anything that glows when you hover it.</p>}
      {toast && <p className="toast" role="status">{toast}</p>}

      {panel === "monitor" ? (
        <MusOS onClose={close} />
      ) : panel ? (
        <Panel id={panel} onClose={close} />
      ) : null}
    </div>
  );
}

function Panel({ id, onClose }: { id: SpotId; onClose: () => void }) {
  const spot = SPOTS[id];
  const body = {
    board: (
      <>
        <p className="epigraph">Journey before destination.</p>
        <QuestLog />
      </>
    ),
    shelf: (
      <>
        <Library />
        <h3 className="sub">Spellbook</h3>
        <p className="meta panel__note">Technical skills, ranked by Mushoku Tensei's seven tiers of magic.</p>
        <Spellbook />
      </>
    ),
    diploma: <Education />,
    trophies: <Hackathons />,
    phone: <Contact />,
    character: (
      <>
        <p className="panel__lead">{profile.tagline}</p>
        <p>
          Computer Engineering grad from the University of Toronto, now a Software Engineer at Amazon. Off the clock:
          fantasy novels, 7,000+ episodes of anime, and a white AMD battlestation.
        </p>
        <Links />
      </>
    ),
    tower: (
      <div className="item-card">
        <span className="item-card__rarity">{battlestation.rarity}</span>
        <h3>{battlestation.name}</h3>
        <ul>{battlestation.specs.map((s) => <li key={s}>{s}</li>)}</ul>
        <p className="item-card__flavor">“{battlestation.flavor}”</p>
      </div>
    ),
  }[id as string];

  return (
    <aside className={`panel ${id === "tower" ? "panel--small" : ""}`} aria-label={spot.title}>
      <header className="panel__head">
        <h2>{spot.title}</h2>
        <button type="button" className="panel__close" onClick={onClose} aria-label="Close (Esc)">✕</button>
      </header>
      <div className="panel__body">{body}</div>
    </aside>
  );
}

const APPS = [
  { id: "projects", icon: "⌨", name: "Projects" },
  { id: "achievements", icon: "🏆", name: "Achievements" },
  { id: "anime", icon: "📺", name: "Anime" },
  { id: "games", icon: "🎮", name: "Games" },
  { id: "resume", icon: "📄", name: "resume.pdf" },
] as const;

function MusOS({ onClose }: { onClose: () => void }) {
  const [app, setApp] = useState<(typeof APPS)[number]["id"]>("projects");
  const current = APPS.find((a) => a.id === app)!;
  return (
    <div className="musos" role="dialog" aria-label="MusOS desktop">
      <div className="musos__window">
        <header className="musos__bar">
          <span className="musos__brand">MusOS</span>
          <span className="musos__title">{current.name}</span>
          <button type="button" className="panel__close" onClick={onClose} aria-label="Close (Esc)">✕</button>
        </header>
        <div className="musos__main">
          <nav className="musos__dock" aria-label="Apps">
            {APPS.map((a) => (
              <button key={a.id} type="button" className={a.id === app ? "is-on" : ""} onClick={() => setApp(a.id)}>
                <span aria-hidden>{a.icon}</span>
                {a.name}
              </button>
            ))}
          </nav>
          <div className="musos__app">
            {app === "projects" && <Projects />}
            {app === "achievements" && <Achievements />}
            {app === "anime" && <Anime />}
            {app === "games" && <Games />}
            {app === "resume" && (
              <div className="musos__resume">
                <p>One page. Every quest so far.</p>
                <a className="btn btn--accent" href={profile.resume} target="_blank" rel="noopener noreferrer">
                  Open résumé (PDF)
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Boot({ done }: { done: boolean }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setGone(true), 700);
    return () => window.clearTimeout(t);
  }, [done]);
  if (gone) return null;
  return (
    <div className={`boot ${done ? "is-done" : ""}`} aria-hidden>
      <div className="boot__inner">
        <p className="boot__logo">MusOS</p>
        <p>Infusing stormlight…</p>
        <p>Loading the study…</p>
        <div className="boot__bar"><span /></div>
      </div>
    </div>
  );
}

function MagicCircle() {
  return (
    <svg className="magic" viewBox="-100 -100 200 200" aria-hidden>
      <circle r="90" />
      <circle r="78" />
      <circle r="40" />
      <polygon points="0,-78 67.5,39 -67.5,39" />
      <polygon points="0,78 67.5,-39 -67.5,-39" />
      <g className="magic__runes">
        {Array.from({ length: 16 }, (_, i) => (
          <text key={i} transform={`rotate(${i * 22.5}) translate(0,-83)`}>
            {"ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ"[i]}
          </text>
        ))}
      </g>
    </svg>
  );
}
