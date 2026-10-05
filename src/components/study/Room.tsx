// The study, a compact diorama built from primitives. Layout (metres, y up):
//   interior x ∈ [-2.3, 2.3], z ∈ [-2.1, 2.1]; back wall at z = -2.1, left wall at x = -2.3.
//   Back wall: quest board, desk + battlestation, figure shelf, posters.
//   Left wall: bookshelf, nightstand (contact), window over the bed.
//   Floor: chair + character, treasure chest (hackathons).
import { useFrame, useLoader } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { experience, hackathons, profile } from "../../data/profile";
import { Avatar } from "./Avatar";
import { toonRamp, toToon } from "./toon";
import type { SpotId, Vec3 } from "./spots";
import {
  basketballTexture,
  blanketTexture,
  chateauTexture,
  diplomaTexture,
  dragonStarsTexture,
  envelopeTexture,
  jumpTapeTexture,
  leafPlateTexture,
  monitorTexture,
  noteTexture,
  plaqueTexture,
  volleyballTexture,
  windowTexture,
} from "./textures";

const RAMP = toonRamp();

const C = {
  wall: "#ece4d6",
  trim: "#3b281c",
  floor: "#9a7048",
  oak: "#c49a6c",
  darkWood: "#4a3020",
  white: "#f4f2ee",
  offWhite: "#e6e2da",
  black: "#1c1b1f",
  red: "#e0313c",
  cork: "#a8784a",
  flame: "#ffb35c",
};

// ---------------------------------------------------------------- spots
type Ctx = {
  onSelect: (id: SpotId) => void;
  hovered: SpotId | null; // shared with the DOM overlay (markers, menu, cursor label)
  setHovered: (id: SpotId | null) => void;
  focus: SpotId | null;
};
const SpotCtx = createContext<Ctx>(null!);

const HOVER = new THREE.Color("#ffcf8a");

function Spot({ id, children }: { id: SpotId; children: ReactNode }) {
  const { onSelect, hovered, setHovered } = useContext(SpotCtx);
  const ref = useRef<THREE.Group>(null!);
  const on = hovered === id;

  // Warm emissive glow while hovered (from the room, a marker, or the menu), restored afterwards.
  useFrame(() => {
    ref.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!m || !("emissive" in m)) return;
      if (!m.userData.base) m.userData.base = { e: m.emissive.clone(), i: m.emissiveIntensity };
      const base = m.userData.base;
      if (on && base.i < 0.5) {
        m.emissive.copy(HOVER);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, 0.24, 0.2);
      } else {
        m.emissive.copy(base.e);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, base.i, 0.2);
      }
    });
  });

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {children}
    </group>
  );
}

// ---------------------------------------------------------------- helpers
type BoxProps = {
  p: Vec3;
  s: Vec3;
  c: string;
  r?: Vec3;
  rough?: number;
  metal?: number;
  e?: string;
  ei?: number;
  shadow?: boolean;
  opacity?: number;
};
// Rounded boxes read as modelled furniture under toon shading; geometries are shared per size.
const roundedCache = new Map<string, THREE.BufferGeometry>();
function roundedBox([w, h, d]: Vec3) {
  const key = `${w}|${h}|${d}`;
  let g = roundedCache.get(key);
  if (!g) {
    const r = Math.min(0.018, Math.min(w, h, d) * 0.3);
    g = r < 0.002 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 2, r);
    roundedCache.set(key, g);
  }
  return g;
}

function Box({ p, s, c, r, e, ei = 1, shadow = true, opacity }: BoxProps) {
  return (
    <mesh position={p} rotation={r} castShadow={shadow} receiveShadow geometry={roundedBox(s)}>
      <meshToonMaterial gradientMap={RAMP}
        color={c}
        emissive={e ?? "#000"}
        emissiveIntensity={e ? ei : 0}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

function Plane({ p, s, r, map }: { p: Vec3; s: [number, number]; r?: Vec3; map: THREE.Texture }) {
  return (
    <mesh position={p} rotation={r}>
      <planeGeometry args={s} />
      <meshToonMaterial gradientMap={RAMP} map={map} />
    </mesh>
  );
}

// Image textures without Suspense: the texture fills in once loaded.
function useImage(url: string | undefined) {
  return useMemo(() => {
    if (!url) return null;
    const t = new THREE.TextureLoader().load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [url]);
}

function Candle({ p, night, h = 0.13 }: { p: Vec3; night: boolean; h?: number }) {
  const light = useRef<THREE.PointLight>(null!);
  const flame = useRef<THREE.Mesh>(null!);
  const seed = useMemo(() => Math.random() * 100, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const f = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 23) * 0.04;
    light.current.intensity = (night ? 1.3 : 0.3) * f;
    flame.current.scale.set(1, f, 1);
  });
  return (
    <group position={p}>
      <mesh castShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.033, h, 16]} />
        <meshToonMaterial gradientMap={RAMP} color="#f3ead8" />
      </mesh>
      <mesh ref={flame} position={[0, h + 0.025, 0]}>
        <coneGeometry args={[0.012, 0.045, 10]} />
        <meshBasicMaterial color={C.flame} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, h + 0.07, 0]} color="#ffa95a" distance={2.4} decay={1.6} />
    </group>
  );
}

// ---------------------------------------------------------------- room
export function Room({
  night,
  chateau,
  focus,
  hovered,
  setHovered,
  onSelect,
}: {
  night: boolean;
  chateau: boolean;
  focus: SpotId | null;
  hovered: SpotId | null;
  setHovered: (id: SpotId | null) => void;
  onSelect: (id: SpotId) => void;
}) {
  const ctx = useMemo(() => ({ onSelect, hovered, setHovered, focus }), [onSelect, hovered, setHovered, focus]);

  return (
    <SpotCtx.Provider value={ctx}>
      <Shell night={night} />
      <Rug />
      <Desk />
      <Battlestation />
      <DeskItems night={night} />
      <FigureShelf />
      <Posters />
      <Character />
      <QuestBoard />
      <Bookshelf night={night} />
      <Nightstand night={night} />
      <Diploma />
      <Bed night={night} />
      <Window night={night} chateau={chateau} />
      <TreasureChest />
      <Clutter />
      <Dust night={night} />
      <SportsCorner />
    </SpotCtx.Provider>
  );
}

function Shell({ night }: { night: boolean }) {
  const lights = useMemo(() => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      pts.push([-2.2 + t * 4.4, 2.5 - Math.sin(t * Math.PI * 3) ** 2 * 0.08, -2.07]);
    }
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      pts.push([-2.27, 2.5 - Math.sin(t * Math.PI * 3) ** 2 * 0.08, -2.05 + t * 4.0]);
    }
    return pts;
  }, []);
  return (
    <group>
      {/* floating slab: wood floor on a dark base */}
      <Box p={[0, -0.03, 0]} s={[4.9, 0.06, 4.5]} c={C.floor} rough={0.75} shadow={false} />
      <Box p={[0, -0.22, 0]} s={[4.9, 0.32, 4.5]} c="#2b1e17" rough={0.9} shadow={false} />
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -2.1 + i * 0.3]}>
          <planeGeometry args={[4.6, 0.008]} />
          <meshBasicMaterial color="#6e4d30" transparent opacity={0.45} />
        </mesh>
      ))}
      {/* walls with a dark cap so the cutaway reads cleanly */}
      <Box p={[-0.075, 1.35, -2.175]} s={[4.75, 2.7, 0.15]} c={C.wall} rough={0.95} />
      <Box p={[-2.375, 1.35, 0.075]} s={[0.15, 2.7, 4.35]} c={C.wall} rough={0.95} />
      <Box p={[-0.075, 2.71, -2.175]} s={[4.75, 0.025, 0.15]} c={C.trim} shadow={false} />
      <Box p={[-2.375, 2.71, 0.075]} s={[0.15, 0.025, 4.35]} c={C.trim} shadow={false} />
      <Box p={[0, 0.05, -2.09]} s={[4.6, 0.1, 0.02]} c={C.trim} />
      <Box p={[-2.29, 0.05, 0]} s={[0.02, 0.1, 4.2]} c={C.trim} />
      {/* fairy lights along the top of both walls */}
      {lights.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color={i % 5 === 0 ? "#ff6a5a" : "#ffd38a"} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 2.35, -1.7]} color="#ffcf8a" intensity={night ? 0.9 : 0.2} distance={3.5} decay={1.6} />
    </group>
  );
}

function Rug() {
  return (
    <group position={[0.55, 0.004, -0.75]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.95, 48]} />
        <meshToonMaterial gradientMap={RAMP} color="#5b1d24" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <ringGeometry args={[0.76, 0.82, 48]} />
        <meshToonMaterial gradientMap={RAMP} color="#c9a46a" />
      </mesh>
    </group>
  );
}

function Desk() {
  const top = 0.765;
  return (
    <group>
      <Box p={[0.5, top - 0.025, -1.7]} s={[2.4, 0.05, 0.8]} c={C.oak} rough={0.55} />
      {[-0.65, 1.65].map((x) =>
        [-2.02, -1.38].map((z) => <Box key={`${x}${z}`} p={[x, (top - 0.05) / 2, z]} s={[0.05, top - 0.05, 0.05]} c={C.white} />),
      )}
      <Box p={[0.45, top + 0.003, -1.5]} s={[1.3, 0.006, 0.42]} c="#efedea" shadow={false} />
      {/* red LED strip behind the desk */}
      <Box p={[0.5, top + 0.02, -2.08]} s={[2.3, 0.012, 0.012]} c={C.red} e={C.red} ei={2.5} shadow={false} />
    </group>
  );
}

function Battlestation() {
  const [avatar, setAvatar] = useState<HTMLImageElement>();
  useEffect(() => {
    const img = new Image();
    img.onload = () => setAvatar(img);
    img.src = profile.photo;
  }, []);
  const screen = useMemo(() => monitorTexture(avatar), [avatar]);
  const fan = useRef<THREE.Group>(null!);
  useFrame((_, dt) => fan.current.children.forEach((f) => (f.rotation.z += dt * 0.6)));
  return (
    <group>
      <Spot id="monitor">
        <Box p={[0.5, 1.2, -1.97]} s={[1.14, 0.68, 0.035]} c={C.white} rough={0.4} />
        <mesh position={[0.5, 1.2, -1.95]}>
          <planeGeometry args={[1.09, 0.62]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <Box p={[0.5, 0.94, -2.02]} s={[0.06, 0.32, 0.04]} c={C.white} />
        <Box p={[0.5, 0.775, -1.97]} s={[0.34, 0.02, 0.2]} c={C.white} />
        <pointLight position={[0.5, 1.2, -1.6]} color="#c8b6ff" intensity={1.8} distance={2.8} decay={1.8} />
      </Spot>

      {/* white PC tower, glass side facing the monitor */}
      <Spot id="tower">
        <group position={[-0.4, 1.17, -1.72]} scale={0.88}>
          <Box p={[0, 0.44, 0]} s={[0.44, 0.02, 0.86]} c={C.white} rough={0.35} />
          <Box p={[0, -0.44, 0]} s={[0.44, 0.02, 0.86]} c={C.white} rough={0.35} />
          <Box p={[-0.21, 0, 0]} s={[0.02, 0.9, 0.86]} c={C.white} rough={0.35} />
          <Box p={[0, 0, -0.42]} s={[0.44, 0.9, 0.02]} c={C.white} rough={0.35} />
          <Box p={[0, 0, 0.42]} s={[0.44, 0.9, 0.02]} c={C.offWhite} rough={0.35} opacity={0.35} />
          <mesh position={[0.215, 0, 0]}>
            <boxGeometry args={[0.01, 0.88, 0.84]} />
            <meshToonMaterial gradientMap={RAMP} color="#d6e6f0" transparent opacity={0.12} />
          </mesh>
          <Box p={[-0.19, 0.05, -0.02]} s={[0.01, 0.7, 0.62]} c="#e8e8e8" />
          {/* white ASRock RX 9070 XT: white shroud, silver backplate, light strip, three fans underneath */}
          <group position={[0.02, -0.08, 0]}>
            <Box p={[0, 0, 0]} s={[0.3, 0.12, 0.66]} c="#f3f3f1" rough={0.35} />
            <Box p={[0, 0.066, 0]} s={[0.29, 0.012, 0.64]} c="#d4d8de" rough={0.3} metal={0.4} />
            <Box p={[0.152, 0.015, 0]} s={[0.004, 0.012, 0.56]} c="#fff" e="#ffffff" ei={1.4} shadow={false} />
            <Box p={[0.152, -0.025, 0.16]} s={[0.004, 0.02, 0.2]} c="#c9ccd2" metal={0.5} rough={0.3} shadow={false} />
            {[-0.21, 0, 0.21].map((z) => (
              <mesh key={z} position={[0, -0.061, z]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.085, 0.008, 6, 28]} />
                <meshToonMaterial gradientMap={RAMP} color="#e6e6e3" emissive="#ffffff" emissiveIntensity={0.5} />
              </mesh>
            ))}
          </group>
          {/* Ryzen 9 7900X under an AIO pump */}
          <mesh position={[-0.13, 0.17, -0.06]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 32]} />
            <meshToonMaterial gradientMap={RAMP} color="#f0f0f0" emissive={C.red} emissiveIntensity={0.6} />
          </mesh>
          {[0, 1].map((i) => (
            <Box key={i} p={[-0.15, 0.2, 0.1 + i * 0.04]} s={[0.06, 0.14, 0.012]} c="#f4f4f4" e="#ff6070" ei={0.8} shadow={false} />
          ))}
          <group ref={fan}>
            {[-0.25, 0, 0.25].map((y) => (
              <mesh key={y} position={[0, y, 0.395]}>
                <torusGeometry args={[0.1, 0.012, 8, 32]} />
                <meshToonMaterial gradientMap={RAMP} color="#fff" emissive="#ff4a5a" emissiveIntensity={1.8} toneMapped={false} />
              </mesh>
            ))}
          </group>
          <pointLight position={[0.05, 0.25, 0]} color="#ff3040" intensity={0.3} distance={1.3} decay={2} />
        </group>
      </Spot>

      {/* peripherals */}
      <Box p={[0.45, 0.78, -1.5]} s={[0.8, 0.028, 0.26]} c={C.white} rough={0.5} />
      <Box p={[0.45, 0.796, -1.5]} s={[0.75, 0.004, 0.21]} c="#ddd" e={C.red} ei={0.25} shadow={false} />
      <mesh position={[1.0, 0.78, -1.48]} scale={[1, 0.5, 1.5]} castShadow>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshToonMaterial gradientMap={RAMP} color={C.white} />
      </mesh>
      {/* speaker (Kenney Furniture Kit, CC0) */}
      <KenneyModel url="/models/kenney/speakerSmall.glb" scale={0.82} position={[1.14, 0.765, -2.0]}
        recolor={{ wood: "#f4f2ee", metalMedium: "#3a3a40" }} />
    </group>
  );
}

function DeskItems({ night }: { night: boolean }) {
  const cover = useImage("/books/monte-cristo.jpg");
  return (
    <group>
      {/* The Count of Monte Cristo, Penguin Classics, face up */}
      <Spot id="montecristo">
        <group position={[1.28, 0.795, -1.5]} rotation={[0, -0.35, 0]}>
          <Box p={[0, -0.0245, 0]} s={[0.2, 0.006, 0.3]} c="#1c1a1a" rough={0.8} />
          <Box p={[0, 0.0245, 0]} s={[0.2, 0.006, 0.3]} c="#1c1a1a" rough={0.8} />
          <Box p={[-0.097, 0, 0]} s={[0.006, 0.055, 0.3]} c="#1c1a1a" rough={0.8} />
          <Box p={[0.002, 0, 0]} s={[0.19, 0.043, 0.288]} c="#efe6d2" rough={0.95} shadow={false} />
          {cover && (
            <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.2, 0.3]} />
              <meshToonMaterial gradientMap={RAMP} map={cover} />
            </mesh>
          )}
        </group>
      </Spot>

      {/* Rudeus's diary */}
      <Spot id="diary">
        <group position={[1.48, 0.79, -1.82]} rotation={[0, 0.25, 0]}>
          <Box p={[0, 0, 0]} s={[0.17, 0.04, 0.23]} c="#6b4a2a" rough={0.9} />
          <Box p={[0, 0.021, 0]} s={[0.1, 0.002, 0.14]} c="#c9a24a" e="#c9a24a" ei={0.15} shadow={false} />
          <Box p={[0.087, 0, 0.02]} s={[0.006, 0.03, 0.05]} c="#8a2a30" shadow={false} />
        </group>
      </Spot>

      {/* desk lamp (Kenney Furniture Kit, CC0) */}
      <group position={[1.55, 0.765, -1.98]}>
        <KenneyModel url="/models/kenney/lampSquareTable.glb" scale={1.45} position={[-0.087, 0, -0.087]}
          recolor={{ lamp: "#fff3dc", metal: "#f4f2ee" }} glow={{ lamp: night ? 0.55 : 0.12 }} />
        <pointLight position={[0, 0.34, 0.12]} color="#ffc98a" intensity={night ? 1.3 : 0.3} distance={2} decay={1.8} />
      </group>

      {/* coffee mug with steam */}
      <Mug position={[1.08, 0.765, -1.72]} />

    </group>
  );
}

// Shelf above the desk: one prop per Hall of Fame anime.
function FigureShelf() {
  return (
    <group>
      <Box p={[0.15, 1.78, -1.99]} s={[1.1, 0.03, 0.2]} c={C.darkWood} />

      {/* Dragon Ball: all seven, in a little cluster */}
      <Spot id="dragonballs">
        <DragonBalls position={[-0.3, 1.795, -1.98]} />
      </Spot>

      {/* Steins;Gate: the Phone Microwave (name subject to change) */}
      <Spot id="microwave">
        <group position={[0.04, 1.795, -1.98]}>
          <Box p={[0, 0.06, 0]} s={[0.22, 0.12, 0.14]} c="#e9e6df" rough={0.5} />
          <Box p={[-0.025, 0.06, 0.071]} s={[0.13, 0.08, 0.004]} c="#1f2a2a" e="#7fffd0" ei={0.25} shadow={false} />
          <Box p={[0.08, 0.06, 0.071]} s={[0.04, 0.09, 0.004]} c="#cfcac0" shadow={false} />
          {[0.085, 0.06, 0.035].map((y) => (
            <Box key={y} p={[0.08, y, 0.074]} s={[0.02, 0.008, 0.004]} c="#555" shadow={false} />
          ))}
          {/* the flip phone wired to it */}
          <Box p={[0.06, 0.128, 0.02]} s={[0.035, 0.012, 0.065]} c="#c0c4cc" metal={0.5} rough={0.3} r={[0, 0.4, 0]} />
          <mesh position={[0.1, 0.1, -0.03]} rotation={[0, 0, 0.6]}>
            <torusGeometry args={[0.03, 0.002, 4, 16, Math.PI]} />
            <meshToonMaterial gradientMap={RAMP} color="#222" />
          </mesh>
        </group>
      </Spot>

      {/* Naruto: a Hidden Leaf headband propped on the shelf, cloth tails draping down */}
      <Spot id="headband">
        <Headband position={[0.32, 1.795, -2.04]} />
      </Spot>
    </group>
  );
}

function DragonBalls({ position }: { position: Vec3 }) {
  const stars = useMemo(() => Array.from({ length: 7 }, (_, i) => dragonStarsTexture(i + 1)), []);
  const R = 0.021;
  // a small display tray: 4 balls at the back, 3 in front
  const spots: Vec3[] = [
    [-0.066, R + 0.012, -0.022], [-0.022, R + 0.012, -0.022], [0.022, R + 0.012, -0.022], [0.066, R + 0.012, -0.022],
    [-0.044, R + 0.012, 0.022], [0.0, R + 0.012, 0.022], [0.044, R + 0.012, 0.022],
  ];
  return (
    <group position={position}>
      <Box p={[0, 0.006, 0]} s={[0.17, 0.012, 0.09]} c="#2a1a12" rough={0.6} />
      <Box p={[0, 0.0125, 0]} s={[0.16, 0.002, 0.08]} c="#5a1a22" rough={1} shadow={false} />
      {spots.map((p, i) => (
        <group key={i} position={p} rotation={[-0.25, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[R, 28, 20]} />
            <meshToonMaterial gradientMap={RAMP} color="#f7951e" emissive="#ff8a00" emissiveIntensity={0.08} />
          </mesh>
          <mesh position={[0, 0, R + 0.0004]} renderOrder={2}>
            <circleGeometry args={[R * 0.82, 24]} />
            <meshBasicMaterial map={stars[i]} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Naruto: a Hidden Leaf headband standing on the shelf, leaning against the wall,
// band wrapping back toward the wall, tails lying on the shelf.
function Headband({ position }: { position: Vec3 }) {
  const plate = useMemo(() => leafPlateTexture(), []);
  const cloth = "#22325e";
  return (
    <group position={position}>
      <group position={[0, 0.026, 0]} rotation={[-0.22, 0, 0]}>
        {/* band behind the plate, curving back on both sides */}
        <Box p={[0, 0, -0.004]} s={[0.13, 0.04, 0.005]} c={cloth} rough={1} />
        {[-1, 1].map((sx) => (
          <Box key={sx} p={[sx * 0.078, 0, -0.022]} s={[0.055, 0.04, 0.005]} r={[0, sx * 0.95, 0]} c={cloth} rough={1} />
        ))}
        {/* plate + Leaf symbol */}
        <Box p={[0, 0, 0.001]} s={[0.12, 0.05, 0.005]} c="#c9ced6" metal={0.6} rough={0.3} />
        <mesh position={[0, 0, 0.0042]}>
          <planeGeometry args={[0.116, 0.047]} />
          <meshToonMaterial gradientMap={RAMP} map={plate} />
        </mesh>
      </group>
      {/* tails lying on the shelf, trailing off to the right */}
      <Box p={[0.12, 0.003, 0.035]} s={[0.1, 0.004, 0.02]} r={[0, -0.25, 0]} c={cloth} rough={1} />
      <Box p={[0.115, 0.006, 0.062]} s={[0.09, 0.004, 0.02]} r={[0, -0.55, 0]} c={cloth} rough={1} />
    </group>
  );
}

// Posters: Mushoku Tensei (MAL Hall of Fame), Future Trunks, and one game (Final Fantasy XV, cover art from Steam).
function Posters() {
  const a = useImage("/posters/mushoku-tensei-s3.jpg"); // AniList cover, 460×648
  const b = useImage("/posters/future-trunks.jpg"); // Future Trunks (image via MyAnimeList)
  // Final Fantasy XV: Steam's wide hero art, cropped to the four bros (≈18–83% of the width)
  const ff = useImage("/posters/final-fantasy-xv-bros.jpg");
  useMemo(() => {
    if (!ff) return;
    ff.repeat.set(0.65, 1);
    ff.offset.set(0.175, 0);
  }, [ff]);
  const poster = (id: SpotId, t: THREE.Texture | null, p: Vec3, r: Vec3 = [0, 0, 0], w = 0.41, h = 0.58) =>
    t && (
      <Spot id={id}>
      <group position={p} rotation={r}>
        <Box p={[0, 0, 0]} s={[w + 0.03, h + 0.04, 0.015]} c="#111" shadow={false} />
        <mesh position={[0, 0, 0.009]}>
          <planeGeometry args={[w, h]} />
          <meshToonMaterial gradientMap={RAMP} map={t} emissiveMap={t} emissive="#ffffff" emissiveIntensity={0.45} />
        </mesh>
      </group>
      </Spot>
    );
  return (
    <>
      {poster("posterMushoku", a, [1.25, 1.95, -2.09], [0, 0, 0.02])}
      {poster("posterTrunks", b, [1.8, 1.92, -2.09], [0, 0, -0.025])}
      {poster("posterFF", ff, [-2.29, 1.72, 1.84], [0, Math.PI / 2, 0.015], 0.46, 0.22)}
    </>
  );
}

function Character() {
  const { hovered, focus } = useContext(SpotCtx);
  const look = hovered === "character" || focus === "character";
  const swivel = useRef<THREE.Group>(null!);
  // swivel the chair round to face the room when someone says hello
  useFrame((_, dt) => {
    swivel.current.rotation.y = THREE.MathUtils.lerp(swivel.current.rotation.y, look ? -1.85 : 0, 1 - Math.exp(-dt * 4));
  });
  return (
    <group position={[0.5, 0, -1.03]}>
      <group ref={swivel}>
      {/* black office chair: mesh back, padded seat, armrests, 5-star base on casters */}
      <Box p={[0, 0.413, 0]} s={[0.5, 0.07, 0.48]} c="#1e1e22" rough={0.85} />
      <Box p={[0, 0.793, 0.25]} s={[0.44, 0.62, 0.05]} c="#232327" rough={0.9} r={[0.12, 0, 0]} />
      <Box p={[0, 0.793, 0.277]} s={[0.4, 0.56, 0.008]} c="#2e2e34" rough={1} r={[0.12, 0, 0]} shadow={false} />
      <Box p={[0, 0.493, 0.22]} s={[0.04, 0.16, 0.03]} c="#141416" metal={0.4} rough={0.5} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Box p={[sx * 0.26, 0.513, 0.02]} s={[0.03, 0.14, 0.03]} c="#141416" metal={0.4} rough={0.5} />
          <Box p={[sx * 0.26, 0.593, 0.0]} s={[0.06, 0.025, 0.24]} c="#1a1a1d" rough={0.8} />
        </group>
      ))}
      <mesh position={[0, 0.23, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.34, 12]} />
        <meshToonMaterial gradientMap={RAMP} color="#141416" />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const ang = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, ang, 0]}>
            <Box p={[0.15, 0.06, 0]} s={[0.3, 0.03, 0.04]} c="#141416" metal={0.5} rough={0.4} />
            <mesh position={[0.29, 0.025, 0]}>
              <sphereGeometry args={[0.025, 10, 8]} />
              <meshToonMaterial gradientMap={RAMP} color="#0e0e10" />
            </mesh>
          </group>
        );
      })}

      <Spot id="character">
        <Avatar look={look} />
      </Spot>
      </group>
    </group>
  );
}

function QuestBoard() {
  const plaque = useMemo(() => plaqueTexture(), []);
  const notes = useMemo(
    () =>
      experience.map((q) => ({
        tex: noteTexture(q.rank, q.company, q.role, `${q.start} – ${q.end}`, !!q.active),
        active: !!q.active,
      })),
    [],
  );
  const spots: Vec3[] = [
    [-0.31, 0.04, -0.04],
    [0.04, 0.08, 0.05],
    [0.36, -0.01, 0.06],
    [0.04, -0.28, -0.08],
  ];
  return (
    <Spot id="board">
      <group position={[-1.3, 1.5, -2.08]} scale={0.84}>
        <Box p={[0, 0, 0]} s={[1.3, 0.95, 0.04]} c={C.darkWood} />
        <Box p={[0, 0, 0.025]} s={[1.2, 0.85, 0.015]} c={C.cork} rough={1} />
        <Plane p={[0, 0.57, 0.025]} s={[1.08, 0.162]} map={plaque} />
        {notes.map((n, i) => {
          const [x, y, rot] = spots[i] ?? [0, 0, 0];
          return (
            <group key={i} position={[x, y, 0.036]} rotation={[0, 0, rot]} scale={n.active ? 1.16 : 1}>
              <Plane p={[0, 0, 0]} s={[0.24, 0.31]} map={n.tex} />
              <mesh position={[0, 0.13, 0.01]}>
                <sphereGeometry args={[0.012, 10, 10]} />
                <meshToonMaterial gradientMap={RAMP} color={n.active ? C.red : "#b8902f"} />
              </mesh>
            </group>
          );
        })}
      </group>
      <pointLight position={[-1.3, 2.15, -1.7]} color="#ffbe7a" intensity={0.8} distance={1.8} decay={1.8} />
    </Spot>
  );
}

const BOOK_COLORS = ["#7a1f24", "#1f4a6b", "#3f5a2c", "#5c3a6e", "#a8741a", "#2b2b33", "#8a5a3b", "#c9b48a", "#3b5f7a", "#6e2c2c"];

function Bookshelf({ night }: { night: boolean }) {
  const rows = useMemo(() => {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return [0.1, 0.58, 1.06, 1.54].map((y, row) => {
      const books: { z: number; w: number; h: number; c: string; tilt: number }[] = [];
      let z = -2.0;
      const end = -1.0;
      while (z < end) {
        const w = 0.04 + rnd() * 0.045;
        const h = 0.28 + rnd() * 0.13;
        books.push({ z: z + w / 2, w, h, c: BOOK_COLORS[Math.floor(rnd() * BOOK_COLORS.length)], tilt: rnd() > 0.93 ? 0.18 : 0 });
        z += w + 0.004;
        if (rnd() > 0.92) z += 0.1;
      }
      return { y, books, row };
    });
  }, []);

  return (
    <group>
      <Spot id="shelf">
        <group>
          <Box p={[-2.12, 1.0, -2.04]} s={[0.34, 2.0, 0.03]} c={C.darkWood} />
          <Box p={[-2.12, 1.0, -0.96]} s={[0.34, 2.0, 0.03]} c={C.darkWood} />
          <Box p={[-2.28, 1.0, -1.5]} s={[0.02, 2.0, 1.1]} c="#3a2418" />
          {[0.08, 0.56, 1.04, 1.52, 2.0].map((y) => (
            <Box key={y} p={[-2.12, y, -1.5]} s={[0.34, 0.03, 1.1]} c={C.darkWood} />
          ))}
          {rows.map(({ y, books, row }) =>
            books.map((b, i) => (
              <Box
                key={`${row}-${i}`}
                p={[-2.14, y + 0.015 + b.h / 2, b.z]}
                s={[0.22, b.h, b.w]}
                r={[b.tilt, 0, 0]}
                c={b.c}
                rough={0.85}
              />
            )),
          )}
        </group>
      </Spot>

      {/* the Teleportation Incident crystal */}
      <Spot id="crystal">
        <mesh position={[-2.1, 2.1, -1.85]}>
          <octahedronGeometry args={[0.07]} />
          <meshToonMaterial gradientMap={RAMP} color="#ff8a8a" emissive="#e0313c" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <pointLight position={[-2.0, 2.2, -1.85]} color="#ff4a4a" intensity={0.4} distance={1.2} decay={2} />
      </Spot>
      <Candle p={[-2.1, 2.015, -1.2]} night={night} />
    </group>
  );
}

// Contact: a sealed envelope propped against the wall on the nightstand, next to East of Eden.
function Nightstand({ night }: { night: boolean }) {
  const eden = useImage("/books/east-of-eden.jpg");
  const envelope = useMemo(() => envelopeTexture(), []);
  return (
    <group>
      <Box p={[-2.05, 0.27, -0.55]} s={[0.42, 0.54, 0.42]} c={C.white} />
      <Box p={[-1.835, 0.38, -0.55]} s={[0.005, 0.02, 0.16]} c="#b8902f" metal={0.6} shadow={false} />
      <Spot id="letter">
        <group position={[-2.19, 0.66, -0.6]} rotation={[0, Math.PI / 2, 0]}>
          <group rotation={[-0.22, 0, 0]}>
            <Box p={[0, 0, 0]} s={[0.24, 0.165, 0.006]} c="#efe5cf" rough={0.9} />
            <mesh position={[0, 0, 0.0035]}>
              <planeGeometry args={[0.24, 0.165]} />
              <meshToonMaterial gradientMap={RAMP} map={envelope} />
            </mesh>
            {/* red wax seal where the flap meets */}
            <mesh position={[0, -0.005, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.006, 20]} />
              <meshToonMaterial gradientMap={RAMP} color="#9b1b22" />
            </mesh>
          </group>
        </group>
      </Spot>
      {/* East of Eden, currently reading */}
      <group position={[-2.0, 0.558, -0.4]} rotation={[0, 0.35, 0]}>
        <Box p={[0, 0, 0]} s={[0.15, 0.035, 0.22]} c="#ddd6c6" />
        {eden && (
          <mesh position={[0, 0.0185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 0.22]} />
            <meshToonMaterial gradientMap={RAMP} map={eden} />
          </mesh>
        )}
      </group>
      <Candle p={[-1.92, 0.54, -0.72]} night={night} h={0.1} />
    </group>
  );
}

function Diploma() {
  const tex = useMemo(() => diplomaTexture(), []);
  return (
    <Spot id="diploma">
      <group position={[-2.29, 1.45, -0.55]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0, 0]} s={[0.4, 0.31, 0.02]} c={C.darkWood} />
        <Plane p={[0, 0, 0.011]} s={[0.35, 0.26]} map={tex} />
      </group>
    </Spot>
  );
}

// The bed nook: tartan blanket, PS5 controller, a Chocobo plush, Slam Dunk, slippers, warm under-bed glow.
function Bed({ night }: { night: boolean }) {
  const blanket = useMemo(() => {
    const t = blanketTexture();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.5, 1.5);
    return t;
  }, []);
  const slamDunk = useImage("/books/slam-dunk.jpg");
  return (
    <group position={[-1.62, 0, 0.95]}>
      {/* frame, mattress, headboard */}
      <Box p={[0, 0.16, 0]} s={[1.3, 0.24, 2.2]} c={C.white} />
      <Box p={[0, 0.34, 0]} s={[1.22, 0.14, 2.12]} c="#f6f3ee" rough={1} />
      <Box p={[0, 0.5, -1.08]} s={[1.3, 0.8, 0.06]} c={C.white} />
      {/* tartan blanket with the sheet folded back over it at the top */}
      <mesh position={[0.02, 0.42, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.26, 0.04, 1.42]} />
        <meshToonMaterial gradientMap={RAMP} map={blanket} />
      </mesh>
      <Box p={[0.02, 0.43, -0.36]} s={[1.28, 0.05, 0.1]} c="#f3ede0" rough={1} />
      {/* pillows */}
      <Box p={[-0.28, 0.46, -0.78]} s={[0.46, 0.1, 0.3]} c="#fbfaf7" rough={1} />
      <Box p={[0.28, 0.46, -0.78]} s={[0.46, 0.1, 0.3]} c="#fbfaf7" rough={1} />

      {/* Chocobo plush */}
      <Spot id="chocobo">
        <group position={[0.38, 0.44, -0.45]} rotation={[0, 0.9, 0]}>
          <mesh position={[0, 0.08, 0]} scale={[1, 0.9, 1.2]} castShadow>
            <sphereGeometry args={[0.08, 20, 16]} />
            <meshToonMaterial gradientMap={RAMP} color="#f2c230" />
          </mesh>
          <mesh position={[0, 0.19, 0.06]} castShadow>
            <sphereGeometry args={[0.055, 20, 16]} />
            <meshToonMaterial gradientMap={RAMP} color="#f2c230" />
          </mesh>
          <mesh position={[0, 0.185, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.018, 0.05, 10]} />
            <meshToonMaterial gradientMap={RAMP} color="#e08a2a" />
          </mesh>
          {[-0.022, 0.022].map((x) => (
            <mesh key={x} position={[x, 0.205, 0.105]}>
              <sphereGeometry args={[0.008, 8, 8]} />
              <meshToonMaterial gradientMap={RAMP} color="#1a1412" />
            </mesh>
          ))}
          {/* crest */}
          {[-0.2, 0.15, 0.45].map((rz, i) => (
            <mesh key={i} position={[0, 0.25, 0.03 - i * 0.02]} rotation={[-0.6, 0, rz]}>
              <coneGeometry args={[0.012, 0.06, 6]} />
              <meshToonMaterial gradientMap={RAMP} color="#f2c230" />
            </mesh>
          ))}
          {/* wings + tail */}
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * 0.075, 0.09, -0.01]} rotation={[0.3, 0, sx * 0.5]} scale={[0.4, 1, 1]}>
              <sphereGeometry args={[0.045, 12, 10]} />
              <meshToonMaterial gradientMap={RAMP} color="#e6b42a" />
            </mesh>
          ))}
          <mesh position={[0, 0.1, -0.1]} rotation={[-1.1, 0, 0]}>
            <coneGeometry args={[0.03, 0.07, 8]} />
            <meshToonMaterial gradientMap={RAMP} color="#e6b42a" />
          </mesh>
        </group>
      </Spot>

      {/* white PS5 DualSense on the blanket */}
      <group position={[0.15, 0.452, 0.3]} rotation={[0, 0.5, 0]}>
        <Box p={[0, 0, 0]} s={[0.15, 0.025, 0.07]} c="#f4f4f2" rough={0.4} />
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.065, -0.002, 0.04]} rotation={[Math.PI / 2 - 0.3, 0, sx * 0.25]}>
            <capsuleGeometry args={[0.022, 0.04, 6, 10]} />
            <meshToonMaterial gradientMap={RAMP} color="#f4f4f2" />
          </mesh>
        ))}
        <Box p={[0, 0.014, -0.005]} s={[0.07, 0.004, 0.045]} c="#1b1b20" rough={0.3} shadow={false} />
        <Box p={[0, 0.014, 0.03]} s={[0.05, 0.003, 0.006]} c="#5b8cff" e="#5b8cff" ei={0.8} shadow={false} />
      </group>

      {/* phone charging by the pillow */}
      <Box p={[-0.42, 0.448, -0.48]} s={[0.075, 0.009, 0.15]} c="#1c1b1f" rough={0.3} r={[0, 0.3, 0]} />
      <mesh position={[-0.47, 0.446, -0.6]} rotation={[Math.PI / 2, 0, 0.6]}>
        <torusGeometry args={[0.05, 0.003, 4, 16, Math.PI]} />
        <meshToonMaterial gradientMap={RAMP} color="#f4f4f2" />
      </mesh>

      {/* Slam Dunk, a small stack with volume 1 on top */}
      <Spot id="manga">
        <group position={[-0.28, 0.44, 0.78]}>
          {["#d8d2c4", "#e6dfcf", "#d2cbbb"].map((c, i) => (
            <Box key={c} p={[0, 0.012 + i * 0.022, 0]} s={[0.12, 0.02, 0.18]} r={[0, i * 0.16 - 0.16, 0]} c={c} rough={0.9} />
          ))}
          <group position={[0, 0.078, 0]} rotation={[0, 0.12, 0]}>
            <Box p={[0, 0, 0]} s={[0.12, 0.02, 0.18]} c="#e9e4d8" rough={0.9} />
            {slamDunk && (
              <mesh position={[0, 0.0105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.12, 0.18]} />
                <meshToonMaterial gradientMap={RAMP} map={slamDunk} />
              </mesh>
            )}
          </group>
        </group>
      </Spot>

      {/* warm LED strip under the bed frame */}
      <Box p={[0.66, 0.03, 0]} s={[0.012, 0.012, 2.1]} c="#ffb36b" e="#ffb36b" ei={night ? 2.2 : 0.4} shadow={false} />
      <pointLight position={[0.85, 0.12, 0.2]} color="#ffb36b" intensity={night ? 0.9 : 0.15} distance={1.6} decay={1.8} />
    </group>
  );
}

// Falling snow drawn just in front of the window's view.
function Snow({ w, h }: { w: number; h: number }) {
  const { geo, speed } = useMemo(() => {
    const n = 70;
    const pos = new Float32Array(n * 3);
    const speed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * w;
      pos[i * 3 + 1] = (Math.random() - 0.5) * h;
      pos[i * 3 + 2] = 0.036;
      speed[i] = 0.05 + Math.random() * 0.07;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo, speed };
  }, [w, h]);
  useFrame(({ clock }, dt) => {
    const a = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < speed.length; i++) {
      let y = a.getY(i) - speed[i] * dt;
      if (y < -h / 2) y += h;
      const x = a.getX(i) + Math.sin(clock.elapsedTime * 0.8 + i) * 0.0006;
      a.setXY(i, Math.max(-w / 2, Math.min(w / 2, x)), y);
    }
    a.needsUpdate = true;
  });
  return (
    <points geometry={geo} raycast={() => null}>
      <pointsMaterial color="#ffffff" size={0.012} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function Window({ night, chateau }: { night: boolean; chateau: boolean }) {
  const city = useMemo(() => windowTexture(night), [night]);
  const ifView = useMemo(() => chateauTexture(), []);
  const curtains = useRef<THREE.Group>(null!);
  // the curtains sway a little, pivoting from the rail
  useFrame(({ clock }) => {
    curtains.current.children.forEach((c, i) => {
      c.rotation.x = Math.sin(clock.elapsedTime * 0.6 + i * 1.7) * 0.035;
    });
  });
  return (
    <Spot id="window">
      <group position={[-2.29, 1.6, 0.85]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0, 0]} s={[1.1, 0.95, 0.05]} c={C.white} />
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.0, 0.85]} />
          <meshBasicMaterial map={chateau ? ifView : city} toneMapped={false} />
        </mesh>
        <Snow w={1.0} h={0.85} />
        <Box p={[0, 0, 0.045]} s={[0.025, 0.85, 0.02]} c={C.white} />
        <Box p={[0, 0, 0.045]} s={[1.0, 0.025, 0.02]} c={C.white} />
        <Box p={[0, -0.5, 0.07]} s={[1.2, 0.035, 0.14]} c={C.white} />
        <Box p={[0, 0.6, 0.1]} s={[1.6, 0.02, 0.02]} c="#3b281c" />
        <group ref={curtains}>
          {[-0.66, 0.66].map((x) => (
            <group key={x} position={[x, 0.58, 0.09]}>
              <Box p={[0, -0.58, 0]} s={[0.18, 1.15, 0.025]} c="#8a2a30" rough={1} />
            </group>
          ))}
        </group>
      </group>
    </Spot>
  );
}

// Hackathons: the Treasure of Monte Cristo. Opens when you hover or visit it.
function TreasureChest() {
  const { hovered, focus } = useContext(SpotCtx);
  const lid = useRef<THREE.Group>(null!);
  const loot = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.PointLight>(null!);
  const open = hovered === "chest" || focus === "chest";
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 5);
    lid.current.rotation.x = THREE.MathUtils.lerp(lid.current.rotation.x, open ? -1.9 : 0, k);
    loot.current.position.y = THREE.MathUtils.lerp(loot.current.position.y, open ? 0.2 : 0.02, k);
    glow.current.intensity = THREE.MathUtils.lerp(glow.current.intensity, open ? 1.6 : 0, k);
  });
  const gold = { color: "#d8a93b" };
  const W = 0.7, H = 0.36, D = 0.44;
  return (
    <Spot id="chest">
      <group position={[1.55, 0, 0.55]} rotation={[0, -0.55, 0]}>
        {/* body */}
        <Box p={[0, H / 2, 0]} s={[W, H, D]} c="#8a5530" rough={0.7} />
        <Box p={[0, H / 2, 0]} s={[W + 0.01, 0.04, D + 0.01]} c="#3a2416" shadow={false} />
        {[-W / 2 + 0.06, W / 2 - 0.06].map((x) => (
          <Box key={x} p={[x, H / 2, 0]} s={[0.04, H + 0.005, D + 0.012]} c="#b8902f" metal={0.6} rough={0.35} shadow={false} />
        ))}
        {/* treasure inside: a cup per win, a medal for the rest */}
        <group ref={loot} position={[0, 0.02, 0]}>
          <mesh position={[0, H - 0.04, 0]}>
            <boxGeometry args={[W - 0.06, 0.04, D - 0.06]} />
            <meshToonMaterial gradientMap={RAMP} color="#e8b84a" emissive="#7a5a10" emissiveIntensity={0.3} />
          </mesh>
          {hackathons.map((h, i) => {
            const x = -0.22 + i * 0.145;
            return h.win ? (
              <group key={h.project} position={[x, H, 0]}>
                <mesh position={[0, 0.03, 0]}>
                  <cylinderGeometry args={[0.007, 0.011, 0.05, 10]} />
                  <meshToonMaterial gradientMap={RAMP} {...gold} />
                </mesh>
                <mesh position={[0, 0.085, 0]} castShadow>
                  <cylinderGeometry args={[0.042, 0.018, 0.065, 20]} />
                  <meshToonMaterial gradientMap={RAMP} {...gold} emissive="#7a5a10" emissiveIntensity={0.3} />
                </mesh>
                {[-1, 1].map((side) => (
                  <mesh key={side} position={[side * 0.047, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <torusGeometry args={[0.015, 0.004, 6, 14]} />
                    <meshToonMaterial gradientMap={RAMP} {...gold} />
                  </mesh>
                ))}
              </group>
            ) : (
              <group key={h.project} position={[x, H + 0.05, 0]}>
                <Box p={[0, 0.05, 0]} s={[0.025, 0.07, 0.004]} c="#1f4a6b" />
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.028, 0.028, 0.006, 20]} />
                  <meshToonMaterial gradientMap={RAMP} color="#dfe3ea" emissive="#8a94a3" emissiveIntensity={0.25} />
                </mesh>
              </group>
            );
          })}
        </group>
        <pointLight ref={glow} position={[0, H + 0.25, 0]} color="#ffc95a" intensity={0} distance={1.6} decay={1.8} />
        {/* lid hinged at the back edge */}
        <group ref={lid} position={[0, H, -D / 2]}>
          <mesh position={[0, 0.0, D / 2]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[D / 2, D / 2, W, 20, 1, false, 0, Math.PI]} />
            <meshToonMaterial gradientMap={RAMP} color="#8a5530" side={THREE.DoubleSide} />
          </mesh>
          {[-W / 2 + 0.06, W / 2 - 0.06].map((x) => (
            <mesh key={x} position={[x, 0, D / 2]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[D / 2 + 0.006, D / 2 + 0.006, 0.04, 20, 1, true, 0, Math.PI]} />
              <meshToonMaterial gradientMap={RAMP} color="#b8902f" side={THREE.DoubleSide} />
            </mesh>
          ))}
          <Box p={[0, -0.03, D + 0.005]} s={[0.07, 0.08, 0.02]} c="#b8902f" metal={0.6} rough={0.35} />
        </group>
      </group>
    </Spot>
  );
}

function Clutter() {
  return (
    <group>
      {/* a few books stacked by the chest */}
      {[0, 1, 2].map((i) => (
        <Box key={i} p={[2.0, 0.03 + i * 0.055, 1.35]} s={[0.24 - i * 0.02, 0.05, 0.32 - i * 0.03]} r={[0, i * 0.25, 0]} c={BOOK_COLORS[i * 3]} />
      ))}
    </group>
  );
}

// Training Arc: a jump-touch tape up the wall, balls on the floor, a tennis racket leaning on the wall.
function SportsCorner() {
  const tape = useMemo(() => jumpTapeTexture(), []);
  const bball = useMemo(() => basketballTexture(), []);
  const vball = useMemo(() => volleyballTexture(), []);
  return (
    <group>
      <pointLight position={[1.7, 1.9, -1.4]} color="#ffd9a8" intensity={1.1} distance={2.6} decay={1.6} />
      <Spot id="court">
        <group>
          {/* jump tape on the back wall, floor to ceiling */}
          <mesh position={[2.08, 1.325, -2.095]}>
            <planeGeometry args={[0.1, 2.65]} />
            <meshToonMaterial gradientMap={RAMP} map={tape} />
          </mesh>
          {/* chalk swipes where jumps have landed */}
          {[2.42, 2.5, 2.46].map((y, i) => (
            <mesh key={i} position={[2.0 + i * 0.02, y, -2.093]} rotation={[0, 0, 0.4 - i * 0.3]}>
              <planeGeometry args={[0.07, 0.012]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          ))}
          <mesh position={[1.95, 0.12, -1.75]} rotation={[0.3, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.12, 28, 20]} />
            <meshToonMaterial gradientMap={RAMP} map={bball} />
          </mesh>
          <mesh position={[2.15, 0.105, -1.45]} rotation={[0.2, 1.4, 0.4]} castShadow>
            <sphereGeometry args={[0.105, 28, 20]} />
            <meshToonMaterial gradientMap={RAMP} map={vball} />
          </mesh>
        </group>
      </Spot>

      {/* tennis racket + ball, leaning in the corner */}
      <group position={[2.22, 0, -1.95]} rotation={[0.12, -0.6, -0.08]}>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.014, 0.016, 0.28, 10]} />
          <meshToonMaterial gradientMap={RAMP} color="#1d1d24" />
        </mesh>
        {/* throat: two arms from the handle up into the frame */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.022, 0.31, 0]} rotation={[0, 0, sx * -0.35]}>
            <cylinderGeometry args={[0.007, 0.007, 0.08, 8]} />
            <meshToonMaterial gradientMap={RAMP} color="#2a4fa0" />
          </mesh>
        ))}
        <mesh position={[0, 0.47, 0]} scale={[0.8, 1.1, 1]}>
          <torusGeometry args={[0.12, 0.01, 8, 32]} />
          <meshToonMaterial gradientMap={RAMP} color="#2a4fa0" />
        </mesh>
        <mesh position={[0, 0.47, 0]} scale={[0.8, 1.1, 1]}>
          <circleGeometry args={[0.115, 24]} />
          <meshToonMaterial gradientMap={RAMP} color="#e9e6dc" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[1.88, 0.033, -1.45]} castShadow>
        <sphereGeometry args={[0.033, 16, 12]} />
        <meshToonMaterial gradientMap={RAMP} color="#d7e84a" />
      </mesh>
    </group>
  );
}

// A Kenney Furniture Kit model, toon-shaded and recoloured per material name.
function KenneyModel({ url, scale, position, rotation, recolor = {}, glow = {} }: {
  url: string; scale: number; position: Vec3; rotation?: Vec3;
  recolor?: Record<string, string>; glow?: Record<string, number>;
}) {
  const gltf = useLoader(GLTFLoader, url);
  const obj = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = mesh.receiveShadow = true;
      const src = mesh.material as THREE.MeshStandardMaterial;
      const toon = toToon(src.clone()) as THREE.MeshToonMaterial;
      if (recolor[src.name]) toon.color.set(recolor[src.name]);
      mesh.material = toon;
    });
    return root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf]);
  useEffect(() => {
    obj.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshToonMaterial | undefined;
      if (m && glow[m.name] !== undefined) {
        m.emissive.set("#ffd9a0");
        m.emissiveIntensity = glow[m.name];
      }
    });
  }, [obj, glow]);
  return <primitive object={obj} scale={scale} position={position} rotation={rotation} />;
}

// A mug on the desk with a few wisps of steam curling up.
function Mug({ position }: { position: Vec3 }) {
  const puffs = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    puffs.current.children.forEach((p, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 4) % 1;
      p.position.set(Math.sin(t * 6 + i) * 0.012, 0.11 + t * 0.2, 0);
      p.scale.setScalar(0.6 + t * 1.4);
      ((p as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.35 * Math.sin(t * Math.PI);
    });
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.032, 0.09, 20]} />
        <meshToonMaterial gradientMap={RAMP} color="#c9a24a" />
      </mesh>
      <mesh position={[0, 0.087, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.031, 20]} />
        <meshBasicMaterial color="#3b2416" />
      </mesh>
      <mesh position={[0.04, 0.05, 0]}>
        <torusGeometry args={[0.02, 0.006, 8, 16, Math.PI]} />
        <meshToonMaterial gradientMap={RAMP} color="#c9a24a" />
      </mesh>
      <group ref={puffs}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} raycast={() => null}>
            <sphereGeometry args={[0.014, 8, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Dust motes drifting slowly through the room light.
function Dust({ night }: { night: boolean }) {
  const { geo, seeds } = useMemo(() => {
    const n = 90;
    const pos = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -2 + Math.random() * 4.2;
      pos[i * 3 + 1] = 0.3 + Math.random() * 2.2;
      pos[i * 3 + 2] = -2 + Math.random() * 3.6;
      seeds[i] = Math.random() * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo, seeds };
  }, []);
  useFrame(({ clock }, dt) => {
    const a = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < seeds.length; i++) {
      const t = clock.elapsedTime * 0.25 + seeds[i];
      let y = a.getY(i) + dt * 0.02;
      if (y > 2.5) y = 0.3;
      a.setXYZ(i, a.getX(i) + Math.sin(t) * dt * 0.03, y, a.getZ(i) + Math.cos(t * 0.7) * dt * 0.03);
    }
    a.needsUpdate = true;
  });
  return (
    <points geometry={geo} raycast={() => null}>
      <pointsMaterial color={night ? "#ffe2b0" : "#fff7e6"} size={0.016} sizeAttenuation transparent opacity={night ? 0.55 : 0.4} depthWrite={false} />
    </points>
  );
}
