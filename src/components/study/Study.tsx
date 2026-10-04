import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { battlestation, diary, profile } from "../../data/profile";
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
import type { SpotId, StationId } from "./spots";
import { isStation, SPOTS, STATION_IDS, STATIONS } from "./spots";
import type { MarkerEls } from "./Scene";
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

const IDLE_DREAM_MS = 60_000;

function StudyRoom() {
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState<SpotId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cast, setCast] = useState(0); // bumps to replay the travel transition
  const [hovered, setHovered] = useState<SpotId | null>(null);
  const markers = useRef<MarkerEls>({});
  const cursorLabel = useRef<HTMLDivElement>(null);
  const [chateau, setChateau] = useState(false);
  const [teleport, setTeleport] = useState(0);
  const [dream, setDream] = useState(false);
  const [night, toggleNight] = useNight();
  const toastTimer = useRef<number>(undefined);
  const shift = useRef(false); // held = "silent casting": skip the transition

  const say = useCallback((text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const go = useCallback((id: SpotId) => {
    if (!shift.current) setCast((c) => c + 1);
    setFocus(id);
  }, []);

  const select = useCallback(
    (id: SpotId) => {
      const spot = SPOTS[id];
      if (spot.action === "chateau") {
        setChateau((c) => {
          say(c ? "Back to Toronto." : "The Château d'If, where Edmond Dantès learned to wait and hope.");
          return !c;
        });
        return;
      }
      if (spot.action === "teleport") {
        setTeleport((t) => t + 1);
        say("Teleportation Incident! You've been displaced…");
        const options = STATION_IDS.filter((s) => s !== focus);
        const dest = options[Math.floor(Math.random() * options.length)];
        window.setTimeout(() => {
          shift.current = true; // the flash is the transition
          go(dest);
          shift.current = false;
        }, 450);
        return;
      }
      if (spot.toast) say(spot.toast);
      if (spot.view) go(id);
    },
    [focus, go, say],
  );

  const close = useCallback(() => setFocus(null), []);

  // Deep links: /?mode=study#board opens straight at that spot.
  useEffect(() => {
    if (!ready) return;
    const id = location.hash.slice(1) as SpotId;
    if (id in SPOTS && SPOTS[id].view) setFocus(id);
  }, [ready]);

  // keyboard: Esc back, 1–6 stations, ← → cycle stations
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      shift.current = e.shiftKey;
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
      if (e.key === "Escape") return close();
      const n = Number(e.key);
      if (n >= 1 && n <= STATIONS.length) return go(STATION_IDS[n - 1]);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = focus && isStation(focus) ? STATION_IDS.indexOf(focus) : -1;
        const step = e.key === "ArrowRight" ? 1 : -1;
        go(STATION_IDS[(i + step + STATION_IDS.length) % STATION_IDS.length]);
      }
    };
    const onUp = (e: KeyboardEvent) => (shift.current = e.shiftKey);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [close, focus, go]);

  // Hitogami visits idle dreamers, once per visit.
  useEffect(() => {
    if (!ready) return;
    let seen = false;
    try { seen = sessionStorage.getItem("hitogami") === "1"; } catch {}
    if (seen) return;
    let timer = window.setTimeout(fire, IDLE_DREAM_MS);
    function fire() {
      setDream(true);
      try { sessionStorage.setItem("hitogami", "1"); } catch {}
      stop();
    }
    function reset() {
      window.clearTimeout(timer);
      timer = window.setTimeout(fire, IDLE_DREAM_MS);
    }
    const events = ["pointermove", "keydown", "wheel", "pointerdown"] as const;
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    function stop() {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    }
    return stop;
  }, [ready]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (cursorLabel.current) cursorLabel.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const leave = () => {
    document.documentElement.dataset.mode = "recruiter";
    try { localStorage.setItem("mode", "recruiter"); } catch {}
    window.dispatchEvent(new CustomEvent("modechange", { detail: "recruiter" }));
  };

  const stationIndex = focus && isStation(focus) ? STATION_IDS.indexOf(focus) : -1;
  const step = (d: number) => go(STATION_IDS[(stationIndex + d + STATION_IDS.length) % STATION_IDS.length]);

  return (
    <div className={`study ${night ? "is-night" : "is-day"}`}>
      <Suspense fallback={null}>
        <Scene
          focus={focus}
          hovered={hovered}
          setHovered={setHovered}
          markers={markers}
          night={night}
          chateau={chateau}
          panelOpen={!!focus}
          onSelect={select}
          onReady={() => setReady(true)}
        />
      </Suspense>

      {ready && (
        <div className="markers" hidden={!!focus}>
          {STATIONS.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => { markers.current[s.id] = el; }}
              type="button"
              className={`marker ${s.id === "board" ? "marker--quest" : ""} ${hovered === s.id ? "is-on" : ""}`}
              onClick={() => go(s.id)}
              onPointerEnter={() => setHovered(s.id)}
              onPointerLeave={() => setHovered(null)}
            >
              <span className="marker__icon" aria-hidden>{s.icon}</span>
              <span className="marker__label">
                <kbd>{i + 1}</kbd> {SPOTS[s.id].label}
              </span>
            </button>
          ))}
        </div>
      )}
      <div ref={cursorLabel} className="cursor-label" hidden={!hovered || isStation(hovered)}>
        {hovered ? SPOTS[hovered].label : ""}
      </div>

      <Boot done={ready} />
      {cast > 0 && <div key={cast} className="blink" aria-hidden />}
      {teleport > 0 && <div key={teleport} className="teleport" aria-hidden />}

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
          <button type="button" className="hud-btn hud-btn--accent" onClick={leave} title="Return to your world">
            Recruiter mode
          </button>
        </div>
      </header>

      <nav className="menu" aria-label="Stations" onMouseLeave={() => setHovered(null)}>
        {STATIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`menu__item ${focus === s.id ? "is-on" : ""}`}
            onClick={() => go(s.id)}
            onMouseEnter={() => setHovered(s.id)}
            onFocus={() => setHovered(s.id)}
            onBlur={() => setHovered(null)}
          >
            <kbd>{i + 1}</kbd>
            <span className="menu__icon" aria-hidden>{s.icon}</span>
            {SPOTS[s.id].label}
          </button>
        ))}
        {focus && (
          <button type="button" className="menu__item menu__back" onClick={close}>
            <kbd>Esc</kbd> Back to the room
          </button>
        )}
      </nav>

      {!focus && ready && (
        <p className="hud hud--hint">Pick a station · keys 1–6 · some objects hide secrets</p>
      )}
      {stationIndex >= 0 && (
        <div className="stepper" role="group" aria-label="Station navigation">
          <button type="button" onClick={() => step(-1)} aria-label="Previous station">
            ← {SPOTS[STATION_IDS[(stationIndex - 1 + STATION_IDS.length) % STATION_IDS.length]].label}
          </button>
          <span>{stationIndex + 1} / {STATION_IDS.length}</span>
          <button type="button" onClick={() => step(1)} aria-label="Next station">
            {SPOTS[STATION_IDS[(stationIndex + 1) % STATION_IDS.length]].label} →
          </button>
        </div>
      )}
      {toast && <p className="toast" role="status">{toast}</p>}

      {focus === "monitor" ? <MusOS onClose={close} /> : focus && SPOTS[focus].title ? <Panel id={focus} onClose={close} /> : null}

      {dream && <Hitogami onWake={() => setDream(false)} />}
    </div>
  );
}

function Panel({ id, onClose }: { id: SpotId; onClose: () => void }) {
  const spot = SPOTS[id];
  const body: Partial<Record<SpotId, React.ReactNode>> = {
    character: (
      <>
        <p className="panel__lead">{profile.tagline}</p>
        <p>
          Computer Engineering grad from the University of Toronto, now a Software Engineer at Amazon. Off the clock:
          The Count of Monte Cristo, 7,000+ episodes of anime, and a white AMD battlestation.
        </p>
        <Links />
      </>
    ),
    board: (
      <>
        <p className="epigraph">Wait and hope.</p>
        <QuestLog />
      </>
    ),
    chest: (
      <>
        <p className="epigraph">The treasure of Monte Cristo.</p>
        <Hackathons />
      </>
    ),
    shelf: (
      <>
        <Library />
        <h3 className="sub">Spellbook</h3>
        <p className="meta panel__note">Technical skills, ranked by Mushoku Tensei's seven tiers of magic.</p>
        <Spellbook />
        <h3 className="sub">Education</h3>
        <Education />
      </>
    ),
    letter: (
      <>
        <Contact />
        <p className="signoff">“Wait and hope.”</p>
      </>
    ),
    diary: (
      <ol className="diary">
        {diary.map((d, i) => (
          <li key={i}>
            <span className="diary__date">{d.date}</span>
            <p>{d.entry}</p>
          </li>
        ))}
      </ol>
    ),
    tower: (
      <div className="item-card">
        <span className="item-card__rarity">{battlestation.rarity}</span>
        <h3>{battlestation.name}</h3>
        <ul>{battlestation.specs.map((s) => <li key={s}>{s}</li>)}</ul>
        <p className="item-card__flavor">“{battlestation.flavor}”</p>
      </div>
    ),
  };

  return (
    <aside className={`panel ${id === "tower" ? "panel--small" : ""}`} aria-label={spot.title}>
      <header className="panel__head">
        <h2>{spot.title}</h2>
        <button type="button" className="panel__close" onClick={onClose} aria-label="Close (Esc)">✕</button>
      </header>
      <div className="panel__body">{body[id]}</div>
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
        <p>Charging mana…</p>
        <p>Lighting the candles…</p>
        <div className="boot__bar"><span /></div>
      </div>
    </div>
  );
}

// Hitogami, the Man-God: appears in dreams, face hidden behind a mosaic.
function Hitogami({ onWake }: { onWake: () => void }) {
  const tiles = useMemo(
    () =>
      Array.from({ length: 12 * 14 }, (_, i) => {
        const x = i % 12;
        const y = Math.floor(i / 12);
        const inHead = (x - 5.5) ** 2 / 26 + (y - 5) ** 2 / 30 < 1;
        const inBody = y > 9 && Math.abs(x - 5.5) < 2 + (y - 9) * 1.2;
        if (!inHead && !inBody) return null;
        const v = 150 + ((x * 37 + y * 91) % 70);
        return `rgb(${v},${v},${v + 8})`;
      }),
    [],
  );
  return (
    <div className="dream" role="dialog" aria-label="A dream" onClick={onWake}>
      <div className="dream__figure" aria-hidden>
        {tiles.map((c, i) => <i key={i} style={c ? { background: c } : undefined} />)}
      </div>
      <p className="dream__line">“Heed my words, visitor… this engineer is worth hiring.”</p>
      <p className="dream__who">— Hitogami</p>
      <p className="dream__wake">Click anywhere to wake up</p>
    </div>
  );
}
