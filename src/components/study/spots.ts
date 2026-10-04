// Every clickable thing in the study: hover label, camera view, and what it opens.
export type Vec3 = [number, number, number];
export type View = { pos: Vec3; target: Vec3 };

export type SpotId =
  | "monitor"
  | "tower"
  | "board"
  | "shelf"
  | "eden"
  | "montecristo"
  | "diploma"
  | "phone"
  | "character"
  | "window"
  | "blade"
  | "goblet"
  | "wand";

type Spot = {
  label: string; // hover label + quick travel
  title?: string; // panel heading
  view?: View; // camera move; omitted = in-place easter egg
  focusAs?: SpotId; // reuse another spot's camera view
  panel?: SpotId; // reuse another spot's panel
  toast?: string;
  action?: "night";
};

export const HOME: View = { pos: [4.3, 2.9, 4.1], target: [-0.7, 1.15, -1.9] };

export const SPOTS: Record<SpotId, Spot> = {
  monitor: {
    label: "Projects · MusOS",
    title: "MusOS",
    view: { pos: [1.3, 1.52, -2.5], target: [0.72, 1.2, -3.6] },
  },
  tower: {
    label: "The Battlestation",
    title: "Item: The Battlestation",
    view: { pos: [1.2, 1.55, -1.8], target: [-0.62, 1.2, -3.35] },
  },
  board: {
    label: "Experience",
    title: "Quest Log",
    view: { pos: [-1.6, 1.75, -0.6], target: [-2.6, 1.7, -3.95] },
  },
  shelf: {
    label: "Skills & Library",
    title: "The Library",
    view: { pos: [-0.6, 1.6, -0.4], target: [-3.8, 1.25, -1.4] },
  },
  eden: {
    label: "East of Eden — currently reading",
    focusAs: "shelf",
    panel: "shelf",
    view: { pos: [-0.6, 1.6, -0.4], target: [-3.8, 1.25, -1.4] },
  },
  montecristo: {
    label: "The Count of Monte Cristo",
    toast: "“All human wisdom is contained in these two words: Wait and Hope.”",
  },
  diploma: {
    label: "Education",
    title: "Education",
    view: { pos: [2.4, 1.95, -1.9], target: [2.95, 1.95, -3.95] },
  },
  phone: {
    label: "Contact",
    title: "Send a raven",
    view: { pos: [2.2, 1.6, -1.7], target: [1.55, 0.8, -3.0] },
  },
  character: {
    label: "Mustafa",
    title: "About me",
    view: { pos: [2.6, 1.9, -0.4], target: [0.7, 1.2, -2.4] },
  },
  window: { label: "Window — toggle day / night", action: "night" },
  blade: { label: "A Shardblade", toast: "“Journey before destination.” — the First Ideal" },
  goblet: { label: "Stormlight spheres", toast: "Infused. (Words of Radiance is my favourite fantasy novel.)" },
  wand: { label: "A wand", toast: "“This time, I'll live without regrets.” — Mushoku Tensei" },
};
