// Every clickable thing in the study.
// Stations are the main navigation (markers, menu, number keys, ← →); the rest are easter eggs.
export type Vec3 = [number, number, number];
export type View = { pos: Vec3; target: Vec3 };

export type StationId = "character" | "board" | "monitor" | "chest" | "shelf" | "court" | "letter";
export type EggId = "montecristo" | "window" | "chocobo" | "manga" | "posterMushoku" | "posterSteins" | "posterFF" | "diploma" | "dragonballs" | "microwave" | "headband" | "crystal" | "diary" | "tower";
export type SpotId = StationId | EggId;

type Spot = {
  label: string; // hover label (+ marker / menu label for stations)
  title?: string; // panel heading
  view?: View; // camera move; omitted = in-place easter egg
  toast?: string;
  action?: "chateau" | "teleport";
};

// Room interior: x ∈ [-2.3, 2.3], z ∈ [-2.1, 2.1]; back wall at z = -2.1, left wall at x = -2.3.
export const HOME: View = { pos: [6.2, 4.6, 6.4], target: [-0.1, 0.75, -0.2] };

export const STATIONS: { id: StationId; icon: string; marker: Vec3 }[] = [
  { id: "character", icon: "✦", marker: [0.5, 1.72, -0.9] },
  { id: "board", icon: "!", marker: [-1.3, 2.08, -2.0] },
  { id: "monitor", icon: "⌨", marker: [0.95, 1.62, -1.9] },
  { id: "chest", icon: "🏆", marker: [1.55, 0.78, 0.55] },
  { id: "shelf", icon: "📚", marker: [-1.95, 1.35, -0.95] },
  { id: "court", icon: "🏀", marker: [2.05, 1.25, -1.95] },
  { id: "letter", icon: "✉", marker: [-1.95, 0.82, -0.35] },
];

export const SPOTS: Record<SpotId, Spot> = {
  character: {
    label: "About",
    title: "About me",
    view: { pos: [2.9, 2.0, 0.8], target: [0.5, 1.1, -1.05] },
  },
  board: {
    label: "Experience",
    title: "Quest Log",
    view: { pos: [-0.75, 1.6, 0.05], target: [-1.3, 1.5, -2.05] },
  },
  monitor: {
    label: "Projects",
    title: "MusOS",
    view: { pos: [1.05, 1.45, -0.85], target: [0.5, 1.2, -1.95] },
  },
  chest: {
    label: "Hackathons",
    title: "Trophy Room",
    view: { pos: [3.2, 2.0, 2.7], target: [1.5, 0.4, 0.5] },
  },
  shelf: {
    label: "Skills & Library",
    title: "The Library",
    view: { pos: [1.0, 1.75, 0.2], target: [-2.1, 1.05, -1.4] },
  },
  court: {
    label: "Training",
    title: "Training Arc",
    view: { pos: [1.45, 2.35, 1.75], target: [1.95, 0.85, -1.95] },
  },
  letter: {
    label: "Contact",
    title: "Send a letter",
    view: { pos: [-0.35, 1.2, -0.25], target: [-2.15, 0.62, -0.58] },
  },

  montecristo: {
    label: "The Count of Monte Cristo",
    toast: "“All human wisdom is contained in these two words: Wait and Hope.”",
   view: { pos: [1.5, 1.25, -1.02], target: [1.28, 0.8, -1.5] } },
  window: { label: "The window", action: "chateau" },
  // close-ups: the camera glides in, a caption shows, no panel
  chocobo: {
    label: "A Chocobo plush",
    toast: "Kweh! — Final Fantasy XV",
    view: { pos: [-0.62, 0.88, 1.0], target: [-1.24, 0.56, 0.5] },
  },
  manga: {
    label: "Slam Dunk, vol. 1–4",
    toast: "“Coach Anzai… I want to play basketball.” — Slam Dunk",
    view: { pos: [-1.45, 1.1, 2.25], target: [-1.9, 0.52, 1.73] },
  },
  posterMushoku: {
    label: "Mushoku Tensei poster",
    toast: "Mushoku Tensei: Jobless Reincarnation — a 10/10 on my MyAnimeList",
    view: { pos: [1.25, 1.92, -0.8], target: [1.25, 1.94, -2.09] },
  },
  posterSteins: {
    label: "Steins;Gate poster",
    toast: "Steins;Gate — a 10/10 on my MyAnimeList. El Psy Kongroo.",
    view: { pos: [1.8, 1.9, -0.8], target: [1.8, 1.92, -2.09] },
  },
  posterFF: {
    label: "Final Fantasy XV poster",
    toast: "Final Fantasy XV — Noctis, Gladio, Ignis & Prompto on the road trip",
    view: { pos: [-1.35, 1.72, 1.84], target: [-2.29, 1.72, 1.84] },
  },
  diploma: {
    label: "Diploma",
    toast: "University of Toronto — BASc, Computer Engineering (2026)",
    view: { pos: [-1.55, 1.45, -0.55], target: [-2.29, 1.45, -0.55] },
  },
  dragonballs: {
    label: "The seven Dragon Balls",
    toast: "All seven. Shenron, I wish for… a 10 ft vertical. — Dragon Ball",
    view: { pos: [-0.27, 1.99, -1.5], target: [-0.3, 1.82, -1.98] },
  },
  microwave: {
    label: "Phone Microwave (name subject to change)",
    toast: "D-Mail sent. Worldline divergence: 1.048596%. El Psy Kongroo. — Steins;Gate",
    view: { pos: [0.1, 1.99, -1.4], target: [0.04, 1.86, -1.98] },
  },
  headband: {
    label: "A Leaf headband",
    toast: "“I'm not gonna run away, I never go back on my word!” — Naruto",
    view: { pos: [0.42, 2.02, -1.45], target: [0.4, 1.98, -2.08] },
  },
  crystal: { label: "A red crystal", action: "teleport" },
  diary: {
    label: "A worn diary",
    title: "Diary",
    view: { pos: [1.75, 1.35, -0.85], target: [1.4, 0.78, -1.55] },
  },
  tower: {
    label: "The Battlestation",
    title: "Item: The Battlestation",
    view: { pos: [1.3, 2.1, -0.2], target: [-0.4, 1.1, -1.72] },
  },
};

export const STATION_IDS = STATIONS.map((s) => s.id);
export const isStation = (id: SpotId): id is StationId => (STATION_IDS as string[]).includes(id);
