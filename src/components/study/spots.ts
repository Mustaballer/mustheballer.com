// Every clickable thing in the study.
// Stations are the main navigation (markers, menu, number keys, ← →); the rest are easter eggs.
export type Vec3 = [number, number, number];
export type View = { pos: Vec3; target: Vec3 };

export type StationId = "character" | "board" | "monitor" | "chest" | "shelf" | "court" | "letter";
export type EggId = "montecristo" | "purse" | "window" | "wand" | "chocobo" | "manga" | "racket" | "mask" | "chess" | "microwave" | "watch" | "crystal" | "diary" | "tower";
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
  },
  purse: {
    label: "A red silk purse",
    toast: "Inside: a settled debt, a diamond, and a note — “Julie's dowry.” Signed, Sinbad the Sailor.",
  },
  window: { label: "The window", action: "chateau" },
  mask: { label: "A white mask", toast: "“Looking cool, Joker!” — Persona 5" },
  chocobo: { label: "A Chocobo plush", toast: "Kweh! — Final Fantasy XV" },
  manga: { label: "Slam Dunk, vol. 1–4", toast: "“Coach Anzai… I want to play basketball.” — Slam Dunk" },
  racket: { label: "A tennis racket", toast: "¡Vamos! Favourite player: Carlos Alcaraz." },
  wand: { label: "A wand", toast: "“This time, I'll live without regrets.” — Mushoku Tensei" },
  chess: {
    label: "A black king",
    toast: "“If the king doesn't lead, how can he expect his subordinates to follow?” — Code Geass",
  },
  microwave: {
    label: "Phone Microwave (name subject to change)",
    toast: "D-Mail sent. Worldline divergence: 1.048596%. El Psy Kongroo. — Steins;Gate",
  },
  watch: {
    label: "A State Alchemist's watch",
    toast: "“To obtain, something of equal value must be lost.” — Fullmetal Alchemist: Brotherhood",
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
