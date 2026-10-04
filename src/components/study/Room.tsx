// The study, built from primitives. Layout (metres, y up):
//   back wall z = -4, left wall x = -4, floor y = 0.
//   Desk + battlestation against the back wall, quest board left of it,
//   bookshelf on the left wall, window + bed toward the front-left.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { experience, library } from "../../data/profile";
import type { SpotId, Vec3 } from "./spots";
import { SPOTS } from "./spots";
import {
  diplomaTexture,
  monitorTexture,
  noteTexture,
  plaqueTexture,
  windowTexture,
} from "./textures";

const C = {
  wall: "#ece4d6",
  wallTrim: "#d8ccb8",
  floor: "#8a6440",
  oak: "#c49a6c",
  darkWood: "#4a3020",
  white: "#f4f2ee",
  offWhite: "#e6e2da",
  black: "#1c1b1f",
  red: "#e0313c",
  cork: "#a8784a",
  parchment: "#efe2c0",
  storm: "#9fd0ff",
  flame: "#ffb35c",
};

// ---------------------------------------------------------------- spots
type Ctx = { onSelect: (id: SpotId) => void; hovered: SpotId | null; setHovered: (id: SpotId | null) => void };
const SpotCtx = createContext<Ctx>(null!);

const HOVER = new THREE.Color("#ffcf8a");

function Spot({ id, children, label = [0, 0.5, 0] }: { id: SpotId; children: ReactNode; label?: Vec3 }) {
  const { onSelect, hovered, setHovered } = useContext(SpotCtx);
  const ref = useRef<THREE.Group>(null!);
  const on = hovered === id;

  // Warm emissive glow on hover, restored afterwards.
  useFrame(() => {
    ref.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!m || !("emissive" in m)) return;
      if (!m.userData.base) m.userData.base = { e: m.emissive.clone(), i: m.emissiveIntensity };
      const base = m.userData.base;
      if (on && base.i < 0.5) {
        m.emissive.copy(HOVER);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, 0.22, 0.2);
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
      {on && (
        <Html position={label} center style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
          <span className="spot-label">{SPOTS[id].label}</span>
        </Html>
      )}
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
function Box({ p, s, c, r, rough = 0.7, metal = 0, e, ei = 1, shadow = true, opacity }: BoxProps) {
  return (
    <mesh position={p} rotation={r} castShadow={shadow} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        emissive={e ?? "#000"}
        emissiveIntensity={e ? ei : 0}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

function Plane({ p, s, r, map, emissive = 0 }: { p: Vec3; s: [number, number]; r?: Vec3; map: THREE.Texture; emissive?: number }) {
  return (
    <mesh position={p} rotation={r}>
      <planeGeometry args={s} />
      <meshStandardMaterial map={map} emissiveMap={map} emissive={emissive ? "#fff" : "#000"} emissiveIntensity={emissive} roughness={0.9} />
    </mesh>
  );
}

function Candle({ p, night, h = 0.16 }: { p: Vec3; night: boolean; h?: number }) {
  const light = useRef<THREE.PointLight>(null!);
  const flame = useRef<THREE.Mesh>(null!);
  const seed = useMemo(() => Math.random() * 100, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const f = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 23) * 0.04;
    light.current.intensity = (night ? 1.6 : 0.4) * f;
    flame.current.scale.set(1, f, 1);
  });
  return (
    <group position={p}>
      <mesh castShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.038, h, 16]} />
        <meshStandardMaterial color="#f3ead8" roughness={0.6} />
      </mesh>
      <mesh ref={flame} position={[0, h + 0.03, 0]}>
        <coneGeometry args={[0.014, 0.05, 10]} />
        <meshBasicMaterial color={C.flame} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, h + 0.08, 0]} color="#ffa95a" distance={3.2} decay={1.6} />
    </group>
  );
}

// ---------------------------------------------------------------- room
export function Room({
  night,
  onSelect,
}: {
  night: boolean;
  onSelect: (id: SpotId) => void;
}) {
  const [hovered, setHovered] = useState<SpotId | null>(null);
  const ctx = useMemo(() => ({ onSelect, hovered, setHovered }), [onSelect, hovered]);

  return (
    <SpotCtx.Provider value={ctx}>
      <Shell />
      <Rug />
      <Desk />
      <Battlestation />
      <DeskItems night={night} />
      <Character />
      <QuestBoard />
      <Bookshelf night={night} />
      <Nightstand night={night} />
      <Bed />
      <Window night={night} />
      <Diploma />
      <Shardblade />
      <Plant />
    </SpotCtx.Provider>
  );
}

function Shell() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={C.floor} roughness={0.8} />
      </mesh>
      {/* floorboard seams */}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-3.75 + i * 0.5, 0.001, 0]}>
          <planeGeometry args={[0.01, 8]} />
          <meshBasicMaterial color="#7a5636" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* walls */}
      <Box p={[0, 1.7, -4.05]} s={[8, 3.4, 0.1]} c={C.wall} rough={0.95} />
      <Box p={[-4.05, 1.7, 0]} s={[0.1, 3.4, 8.2]} c={C.wall} rough={0.95} />
      {/* skirting */}
      <Box p={[0, 0.06, -3.99]} s={[8, 0.12, 0.03]} c={C.wallTrim} />
      <Box p={[-3.99, 0.06, 0]} s={[0.03, 0.12, 8]} c={C.wallTrim} />
    </group>
  );
}

function Rug() {
  return (
    <group position={[0.4, 0.004, -0.9]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.7, 64]} />
        <meshStandardMaterial color="#5b1d24" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <ringGeometry args={[1.35, 1.45, 64]} />
        <meshStandardMaterial color="#c9a46a" roughness={1} />
      </mesh>
    </group>
  );
}

function Desk() {
  const top = 0.76;
  return (
    <group>
      <Box p={[0.6, top - 0.03, -3.35]} s={[3.4, 0.06, 1.1]} c={C.oak} rough={0.55} />
      {[-1.0, 2.2].map((x) =>
        [-3.8, -2.9].map((z) => <Box key={`${x}${z}`} p={[x, (top - 0.06) / 2, z]} s={[0.06, top - 0.06, 0.06]} c={C.white} />),
      )}
      {/* desk mat */}
      <Box p={[0.75, top + 0.003, -3.05]} s={[1.6, 0.006, 0.5]} c="#efedea" shadow={false} />
      {/* red LED strip behind the desk */}
      <Box p={[0.6, top + 0.02, -3.97]} s={[3.2, 0.015, 0.015]} c={C.red} e={C.red} ei={2.5} shadow={false} />
    </group>
  );
}

function Battlestation() {
  const screen = useMemo(() => monitorTexture(), []);
  const fan = useRef<THREE.Group>(null!);
  useFrame((_, dt) => fan.current.children.forEach((f) => (f.rotation.z += dt * 0.6)));
  return (
    <group>
      {/* monitor */}
      <Spot id="monitor" label={[0.75, 1.75, -3.55]}>
        <Box p={[0.75, 1.22, -3.62]} s={[1.32, 0.78, 0.04]} c={C.white} rough={0.4} />
        <mesh position={[0.75, 1.22, -3.597]}>
          <planeGeometry args={[1.26, 0.72]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <Box p={[0.75, 0.94, -3.68]} s={[0.07, 0.36, 0.05]} c={C.white} />
        <Box p={[0.75, 0.77, -3.62]} s={[0.4, 0.02, 0.24]} c={C.white} />
        <pointLight position={[0.75, 1.25, -3.2]} color="#c8b6ff" intensity={2.2} distance={3.5} decay={1.8} />
      </Spot>

      {/* white PC tower, glass side facing the monitor */}
      <Spot id="tower" label={[-0.62, 1.9, -3.35]}>
        <group position={[-0.62, 1.215, -3.35]}>
          {/* shell (top, bottom, back, far side, front) */}
          <Box p={[0, 0.44, 0]} s={[0.44, 0.02, 0.86]} c={C.white} rough={0.35} />
          <Box p={[0, -0.44, 0]} s={[0.44, 0.02, 0.86]} c={C.white} rough={0.35} />
          <Box p={[-0.21, 0, 0]} s={[0.02, 0.9, 0.86]} c={C.white} rough={0.35} />
          <Box p={[0, 0, -0.42]} s={[0.44, 0.9, 0.02]} c={C.white} rough={0.35} />
          <Box p={[0, 0, 0.42]} s={[0.44, 0.9, 0.02]} c={C.offWhite} rough={0.35} opacity={0.35} />
          {/* tempered glass */}
          <mesh position={[0.215, 0, 0]}>
            <boxGeometry args={[0.01, 0.88, 0.84]} />
            <meshStandardMaterial color="#d6e6f0" transparent opacity={0.12} roughness={0.05} metalness={0.2} />
          </mesh>
          {/* white motherboard */}
          <Box p={[-0.19, 0.05, -0.02]} s={[0.01, 0.7, 0.62]} c="#e8e8e8" />
          {/* RX 9070 XT */}
          <group position={[0.02, -0.08, 0]}>
            <Box p={[0, 0, 0]} s={[0.3, 0.13, 0.66]} c="#2a2a2e" rough={0.4} metal={0.5} />
            <Box p={[0.152, 0.0, 0]} s={[0.004, 0.02, 0.6]} c={C.red} e={C.red} ei={3} shadow={false} />
            <Box p={[0.152, 0.045, 0.1]} s={[0.004, 0.025, 0.24]} c="#eee" e="#fff" ei={0.6} shadow={false} />
          </group>
          {/* Ryzen 9 7900X under an AIO pump */}
          <mesh position={[-0.13, 0.17, -0.06]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 32]} />
            <meshStandardMaterial color="#f0f0f0" emissive={C.red} emissiveIntensity={0.6} />
          </mesh>
          {/* RAM with RGB */}
          {[0, 1].map((i) => (
            <Box key={i} p={[-0.15, 0.2, 0.1 + i * 0.04]} s={[0.06, 0.14, 0.012]} c="#f4f4f4" e="#ff6070" ei={0.8} shadow={false} />
          ))}
          {/* front fans */}
          <group ref={fan}>
            {[-0.25, 0, 0.25].map((y) => (
              <mesh key={y} position={[0, y, 0.395]}>
                <torusGeometry args={[0.1, 0.012, 8, 32]} />
                <meshStandardMaterial color="#fff" emissive="#ff4a5a" emissiveIntensity={1.8} toneMapped={false} />
              </mesh>
            ))}
          </group>
          {/* top radiator fans */}
          {[-0.2, 0.2].map((z) => (
            <mesh key={z} position={[0, 0.405, z]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.09, 0.01, 8, 32]} />
              <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
          ))}
          <pointLight position={[0.05, 0, 0]} color="#ff3040" intensity={0.8} distance={1.4} decay={2} />
        </group>
      </Spot>
      <pointLight position={[0.0, 1.2, -3.0]} color="#ff3040" intensity={0.9} distance={2.4} decay={2} />

      {/* peripherals */}
      <Box p={[0.75, 0.785, -3.02]} s={[0.92, 0.03, 0.3]} c={C.white} rough={0.5} />
      <Box p={[0.75, 0.802, -3.02]} s={[0.86, 0.004, 0.24]} c="#ddd" e={C.red} ei={0.25} shadow={false} />
      <mesh position={[1.45, 0.79, -3.0]} scale={[1, 0.5, 1.5]} castShadow>
        <sphereGeometry args={[0.04, 16, 12]} />
        <meshStandardMaterial color={C.white} roughness={0.4} />
      </mesh>
      {/* headphones stand */}
      <Box p={[-0.15, 0.95, -3.7]} s={[0.03, 0.38, 0.03]} c={C.white} />
      <mesh position={[-0.15, 1.12, -3.7]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.1, 0.018, 8, 24, Math.PI]} />
        <meshStandardMaterial color={C.white} />
      </mesh>
    </group>
  );
}

function DeskItems({ night }: { night: boolean }) {
  const spheres = useRef<THREE.Group>(null!);
  const [infused, setInfused] = useState(1);
  useFrame(({ clock }) => {
    spheres.current.children.forEach((s, i) => {
      s.position.y = 0.055 + Math.sin(clock.elapsedTime * 1.5 + i) * 0.004;
    });
  });
  return (
    <group>
      {/* The Count of Monte Cristo */}
      <Spot id="montecristo" label={[1.82, 1.0, -3.0]}>
        <group position={[1.82, 0.79, -3.02]} rotation={[0, 0.35, 0]}>
          <Box p={[0, 0, 0]} s={[0.26, 0.07, 0.36]} c="#7a1f24" rough={0.8} />
          <Box p={[0.004, 0, 0]} s={[0.25, 0.06, 0.355]} c="#efe6d2" shadow={false} />
          <Box p={[0, 0.036, 0]} s={[0.12, 0.002, 0.2]} c="#c9a24a" e="#c9a24a" ei={0.2} shadow={false} />
          <Box p={[0.06, 0.02, 0.19]} s={[0.012, 0.002, 0.08]} c="#c9a24a" shadow={false} />
        </group>
      </Spot>

      {/* Stormlight goblet */}
      <Spot id="goblet" label={[2.05, 1.15, -3.6]}>
        <group
          position={[2.05, 0.76, -3.6]}
          onClick={() => setInfused((v) => (v >= 3 ? 1 : v + 1))}
        >
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.012, 24]} />
            <meshStandardMaterial color="#cfd6de" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
            <meshStandardMaterial color="#cfd6de" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.08, 0.04, 0.12, 24, 1, true]} />
            <meshStandardMaterial color="#e8f4ff" transparent opacity={0.25} side={THREE.DoubleSide} roughness={0.05} />
          </mesh>
          <group ref={spheres} position={[0, 0.07, 0]}>
            {[[-0.02, 0.02], [0.025, 0.01], [0, -0.025], [0.015, 0.03], [-0.03, -0.01]].map(([x, z], i) => (
              <mesh key={i} position={[x, 0.06 + (i % 2) * 0.02, z]}>
                <sphereGeometry args={[0.016, 12, 12]} />
                <meshBasicMaterial color={i === 3 ? "#ffd38a" : C.storm} toneMapped={false} />
              </mesh>
            ))}
          </group>
          <pointLight position={[0, 0.22, 0]} color="#8cc8ff" intensity={(night ? 1.2 : 0.3) * infused} distance={2.2} decay={1.8} />
        </group>
      </Spot>

      <Candle p={[2.08, 0.76, -3.2]} night={night} />
      <Candle p={[2.0, 0.76, -3.3]} night={night} h={0.11} />

      {/* phone */}
      <Spot id="phone" label={[1.6, 1.0, -3.0]}>
        <Box p={[1.6, 0.775, -3.12]} s={[0.085, 0.01, 0.17]} c={C.black} rough={0.3} r={[0, -0.2, 0]} />
        <Box p={[1.6, 0.781, -3.12]} s={[0.075, 0.002, 0.155]} c="#203050" e="#5b8cff" ei={0.6} r={[0, -0.2, 0]} shadow={false} />
      </Spot>

      {/* a wand, Aqua Heartia-inspired */}
      <Spot id="wand" label={[-0.05, 1.0, -2.98]}>
        <group position={[-0.05, 0.785, -2.98]} rotation={[0, 0.4, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.01, 0.014, 0.42, 10]} />
            <meshStandardMaterial color="#5a3a24" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.23, 0]}>
            <octahedronGeometry args={[0.03]} />
            <meshStandardMaterial color="#6ec6ff" emissive="#2d9bff" emissiveIntensity={1.2} toneMapped={false} />
          </mesh>
        </group>
      </Spot>
    </group>
  );
}

function Character() {
  const head = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const { hovered } = useContext(SpotCtx);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    body.current.position.y = Math.sin(t * 1.6) * 0.006;
    // glance back at the visitor on hover
    const want = hovered === "character" ? 0.9 : Math.sin(t * 0.3) * 0.08;
    head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, want, 0.08);
  });
  const skin = "#c99a78";
  const hoodie = "#26232b";
  return (
    <group position={[0.75, 0, -2.35]}>
      {/* gaming chair */}
      <Box p={[0, 0.5, 0]} s={[0.56, 0.09, 0.54]} c={C.white} />
      <Box p={[0, 0.86, 0.27]} s={[0.5, 0.62, 0.07]} c={C.white} r={[0.12, 0, 0]} />
      <Box p={[0, 0.86, 0.31]} s={[0.1, 0.58, 0.01]} c={C.red} r={[0.12, 0, 0]} shadow={false} />
      <Box p={[0, 0.25, 0]} s={[0.05, 0.45, 0.05]} c="#bbb" metal={0.6} />
      <Box p={[0, 0.04, 0]} s={[0.6, 0.04, 0.06]} c="#ccc" metal={0.6} />
      <Box p={[0, 0.04, 0]} s={[0.06, 0.04, 0.6]} c="#ccc" metal={0.6} />

      <Spot id="character" label={[0, 1.75, 0]}>
        <group ref={body}>
          {/* torso */}
          <mesh position={[0, 0.88, -0.02]} castShadow>
            <capsuleGeometry args={[0.17, 0.32, 8, 16]} />
            <meshStandardMaterial color={hoodie} roughness={0.9} />
          </mesh>
          {/* legs */}
          {[-0.1, 0.1].map((x) => (
            <mesh key={x} position={[x, 0.6, -0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <capsuleGeometry args={[0.065, 0.3, 6, 12]} />
              <meshStandardMaterial color="#3a3f4f" roughness={0.9} />
            </mesh>
          ))}
          {/* arms reaching for keyboard and mouse */}
          {[
            { from: [-0.2, 1.05, 0], to: [-0.12, 0.84, -0.6] },
            { from: [0.2, 1.05, 0], to: [0.68, 0.82, -0.62] },
          ].map(({ from, to }, i) => {
            const a = new THREE.Vector3(...(from as Vec3));
            const b = new THREE.Vector3(...(to as Vec3));
            const mid = a.clone().add(b).multiplyScalar(0.5);
            const len = a.distanceTo(b);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
            return (
              <group key={i}>
                <mesh position={mid} quaternion={q} castShadow>
                  <capsuleGeometry args={[0.05, len - 0.1, 6, 12]} />
                  <meshStandardMaterial color={hoodie} roughness={0.9} />
                </mesh>
                <mesh position={b}>
                  <sphereGeometry args={[0.045, 12, 12]} />
                  <meshStandardMaterial color={skin} />
                </mesh>
              </group>
            );
          })}
          {/* head */}
          <group ref={head} position={[0, 1.36, -0.04]}>
            <mesh castShadow>
              <sphereGeometry args={[0.14, 24, 20]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
            {/* hair */}
            <mesh position={[0, 0.04, 0.02]} scale={[1.06, 0.92, 1.08]}>
              <sphereGeometry args={[0.14, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshStandardMaterial color="#17120f" roughness={0.8} />
            </mesh>
            {/* headphones */}
            <mesh rotation={[0, 0, 0]} position={[0, 0.02, 0]}>
              <torusGeometry args={[0.155, 0.015, 8, 24, Math.PI]} />
              <meshStandardMaterial color={C.white} />
            </mesh>
            {[-0.15, 0.15].map((x) => (
              <mesh key={x} position={[x, -0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
                <meshStandardMaterial color={C.white} emissive={C.red} emissiveIntensity={0.3} />
              </mesh>
            ))}
          </group>
        </group>
      </Spot>
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
  const spots: [number, number, number][] = [
    [-0.42, 0.08, -0.04],
    [0.05, 0.12, 0.05],
    [0.48, 0.02, 0.06],
    [0.05, -0.38, -0.08],
  ];
  return (
    <Spot id="board" label={[-2.6, 2.6, -3.9]}>
      <group position={[-2.6, 1.72, -3.97]}>
        <Box p={[0, 0, 0]} s={[1.84, 1.3, 0.05]} c={C.darkWood} />
        <Box p={[0, 0, 0.03]} s={[1.72, 1.18, 0.02]} c={C.cork} rough={1} />
        <Plane p={[0, 0.78, 0.03]} s={[1.5, 0.225]} map={plaque} />
        {notes.map((n, i) => {
          const [x, y, rot] = spots[i] ?? [0, 0, 0];
          const scale = n.active ? 1.18 : 1;
          return (
            <group key={i} position={[x, y, 0.045]} rotation={[0, 0, rot]} scale={scale}>
              <Plane p={[0, 0, 0]} s={[0.33, 0.42]} map={n.tex} />
              <mesh position={[0, 0.18, 0.012]}>
                <sphereGeometry args={[0.016, 10, 10]} />
                <meshStandardMaterial color={n.active ? C.red : "#b8902f"} metalness={0.3} roughness={0.4} />
              </mesh>
            </group>
          );
        })}
      </group>
      {/* lantern lighting the board */}
      <pointLight position={[-2.6, 2.7, -3.4]} color="#ffbe7a" intensity={1.2} distance={2.6} decay={1.8} />
    </Spot>
  );
}

const BOOK_COLORS = ["#7a1f24", "#1f4a6b", "#3f5a2c", "#5c3a6e", "#a8741a", "#2b2b33", "#8a5a3b", "#c9b48a", "#3b5f7a", "#6e2c2c"];

function Bookshelf({ night }: { night: boolean }) {
  // deterministic "random" books
  const rows = useMemo(() => {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return [0.13, 0.69, 1.25, 1.81].map((y, row) => {
      const books: { z: number; w: number; h: number; c: string; tilt: number }[] = [];
      let z = -2.2;
      while (z < -0.65) {
        const w = 0.045 + rnd() * 0.05;
        const h = 0.3 + rnd() * 0.16;
        books.push({ z: z + w / 2, w, h, c: BOOK_COLORS[Math.floor(rnd() * BOOK_COLORS.length)], tilt: rnd() > 0.93 ? 0.18 : 0 });
        z += w + 0.004;
        if (rnd() > 0.9) z += 0.12; // small gaps
      }
      return { y, books, row };
    });
  }, []);

  return (
    <group>
      <Spot id="shelf" label={[-3.7, 2.55, -1.4]}>
        <group>
          {/* carcass */}
          <Box p={[-3.76, 1.15, -2.3]} s={[0.4, 2.3, 0.04]} c={C.darkWood} />
          <Box p={[-3.76, 1.15, -0.5]} s={[0.4, 2.3, 0.04]} c={C.darkWood} />
          <Box p={[-3.95, 1.15, -1.4]} s={[0.02, 2.3, 1.8]} c="#3a2418" />
          {[0.1, 0.66, 1.22, 1.78, 2.3].map((y) => (
            <Box key={y} p={[-3.76, y, -1.4]} s={[0.4, 0.035, 1.8]} c={C.darkWood} />
          ))}
          {rows.map(({ y, books, row }) =>
            books.map((b, i) => (
              <Box
                key={`${row}-${i}`}
                p={[-3.78, y + 0.02 + b.h / 2, b.z]}
                s={[0.26, b.h, b.w]}
                r={[b.tilt, 0, 0]}
                c={b.c}
                rough={0.85}
              />
            )),
          )}
          {/* the three favourites face out on the top shelf */}
          {library.map((b, i) => (
            <group key={b.title} position={[-3.62, 2.03, -1.95 + i * 0.27]} rotation={[0, Math.PI / 2, 0.06]}>
              <Box p={[0, 0, 0]} s={[0.2, 0.3, 0.04]} c={b.spine} rough={0.7} />
              <Box p={[0, 0.06, 0.021]} s={[0.12, 0.02, 0.002]} c="#d9b45a" e="#d9b45a" ei={0.3} shadow={false} />
            </group>
          ))}
        </group>
      </Spot>
      <Candle p={[-3.75, 2.32, -0.75]} night={night} />
      {/* a small crystal on top */}
      <mesh position={[-3.75, 2.4, -2.0]}>
        <octahedronGeometry args={[0.06]} />
        <meshStandardMaterial color="#cfe8ff" emissive={C.storm} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Nightstand({ night }: { night: boolean }) {
  return (
    <group>
      <Box p={[-3.68, 0.28, 0.6]} s={[0.5, 0.56, 0.5]} c={C.white} />
      <Box p={[-3.43, 0.38, 0.6]} s={[0.005, 0.02, 0.2]} c="#b8902f" metal={0.6} shadow={false} />
      <Spot id="eden" label={[-3.65, 0.85, 0.6]}>
        <group position={[-3.66, 0.575, 0.55]} rotation={[0, 0.5, 0]}>
          {/* East of Eden, open face-down with a bookmark */}
          <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.24, 0.035, 0.34]} />
            <meshStandardMaterial color="#3f5a2c" roughness={0.8} />
          </mesh>
          <Box p={[0.05, 0.02, 0.18]} s={[0.015, 0.002, 0.08]} c={C.red} shadow={false} />
        </group>
      </Spot>
      <Candle p={[-3.78, 0.56, 0.78]} night={night} />
    </group>
  );
}

function Bed() {
  return (
    <group position={[-3.05, 0, 2.55]}>
      <Box p={[0, 0.2, 0]} s={[1.8, 0.3, 2.3]} c={C.white} />
      <Box p={[0, 0.42, 0]} s={[1.7, 0.16, 2.2]} c="#f6f3ee" rough={1} />
      <Box p={[0.02, 0.51, 0.35]} s={[1.74, 0.05, 1.5]} c="#7a1f24" rough={1} />
      <Box p={[-0.45, 0.56, -0.85]} s={[0.6, 0.12, 0.38]} c="#fbfaf7" rough={1} />
      <Box p={[0.35, 0.56, -0.85]} s={[0.6, 0.12, 0.38]} c="#fbfaf7" rough={1} />
      <Box p={[0, 0.6, -1.13]} s={[1.8, 1.0, 0.08]} c={C.white} />
    </group>
  );
}

function Window({ night }: { night: boolean }) {
  const tex = useMemo(() => windowTexture(night), [night]);
  return (
    <Spot id="window" label={[-3.85, 2.55, 1.05]}>
      <group position={[-3.99, 1.75, 1.05]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0, 0]} s={[1.3, 1.1, 0.06]} c={C.white} />
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.18, 0.98]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        <Box p={[0, 0, 0.05]} s={[0.03, 0.98, 0.02]} c={C.white} />
        <Box p={[0, 0, 0.05]} s={[1.18, 0.03, 0.02]} c={C.white} />
        <Box p={[0, -0.58, 0.08]} s={[1.4, 0.04, 0.16]} c={C.white} />
        {/* curtains */}
        <Box p={[-0.78, 0.0, 0.1]} s={[0.22, 1.35, 0.03]} c="#8a2a30" rough={1} />
        <Box p={[0.78, 0.0, 0.1]} s={[0.22, 1.35, 0.03]} c="#8a2a30" rough={1} />
      </group>
    </Spot>
  );
}

function Diploma() {
  const tex = useMemo(() => diplomaTexture(), []);
  return (
    <Spot id="diploma" label={[2.95, 2.4, -3.9]}>
      <group position={[2.95, 1.95, -3.98]}>
        <Box p={[0, 0, 0]} s={[0.62, 0.5, 0.03]} c={C.darkWood} />
        <Plane p={[0, 0, 0.017]} s={[0.54, 0.42]} map={tex} />
      </group>
    </Spot>
  );
}

function Shardblade() {
  const glow = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(({ clock }) => {
    glow.current.emissiveIntensity = 0.08 + Math.sin(clock.elapsedTime * 1.2) * 0.05;
  });
  return (
    <Spot id="blade" label={[0.75, 2.85, -3.9]}>
      <group position={[0.75, 2.45, -3.95]} rotation={[0, 0, -0.05]}>
        {/* blade with a subtle glyph glow */}
        <mesh position={[0.25, 0, 0]}>
          <boxGeometry args={[1.5, 0.11, 0.015]} />
          <meshStandardMaterial ref={glow} color="#e8edf2" metalness={0.3} roughness={0.3} emissive="#7fb8ff" />
        </mesh>
        <Box p={[0.25, -0.05, 0]} s={[1.45, 0.02, 0.018]} c="#b9c4d0" metal={0.9} rough={0.2} />
        {/* crossguard + hilt */}
        <Box p={[-0.52, 0, 0]} s={[0.05, 0.3, 0.04]} c="#8c96a4" metal={0.8} rough={0.3} />
        <Box p={[-0.7, 0, 0]} s={[0.32, 0.04, 0.04]} c="#2a2228" />
        <mesh position={[-0.88, 0, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#9fd0ff" emissive="#5aa8ff" emissiveIntensity={1} />
        </mesh>
        {/* wall pegs */}
        <Box p={[-0.3, -0.08, 0.0]} s={[0.03, 0.05, 0.06]} c={C.darkWood} />
        <Box p={[0.6, -0.08, 0.0]} s={[0.03, 0.05, 0.06]} c={C.darkWood} />
      </group>
    </Spot>
  );
}

function Plant() {
  return (
    <group position={[-3.55, 0, -0.1]}>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.34, 20]} />
        <meshStandardMaterial color={C.white} />
      </mesh>
      {[[0, 0.55, 0, 0.22], [0.1, 0.72, 0.05, 0.16], [-0.08, 0.68, -0.06, 0.15]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={i ? "#4f7a3a" : "#3f6a30"} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}
