import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";
import { Room } from "./Room";
import type { SpotId, StationId } from "./spots";
import { HOME, SPOTS, STATIONS } from "./spots";

export type MarkerEls = Partial<Record<StationId, HTMLElement | null>>;

type Props = {
  focus: SpotId | null;
  hovered: SpotId | null;
  setHovered: (id: SpotId | null) => void;
  markers: React.RefObject<MarkerEls>;
  night: boolean;
  chateau: boolean;
  panelOpen: boolean;
  onSelect: (id: SpotId) => void;
  onReady: () => void;
};

export default function Scene({ focus, hovered, setHovered, markers, night, chateau, panelOpen, onSelect, onReady }: Props) {
  // Canvas textures draw text, so wait for the web fonts first.
  const [fonts, setFonts] = useState(false);
  useEffect(() => {
    Promise.all([
      document.fonts.load('600 40px "Cormorant Garamond"'),
      document.fonts.load('italic 600 40px "Cormorant Garamond"'),
      document.fonts.load('500 20px "Inter Variable"'),
    ])
      .catch(() => {})
      .finally(() => setFonts(true));
  }, []);

  const bg = night ? "#0f0c14" : "#e8dfd0";
  return (
    <Canvas
      className="study__canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 32, near: 0.05, far: 60, position: [9, 7, 9.5] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => (document.body.style.cursor = "")}
    >
      <color attach="background" args={[bg]} />
      <Lights night={night} />
      {fonts && (
        <>
          <Room night={night} chateau={chateau} focus={focus} hovered={hovered} setHovered={setHovered} onSelect={onSelect} />
          <Ready onReady={onReady} />
        </>
      )}
      <Rig focus={focus} panelOpen={panelOpen} />
      <Outlines />
      <Projector markers={markers} />
    </Canvas>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) onReady();
  });
  return null;
}

const shadowProps = {
  castShadow: true,
  "shadow-mapSize": [1024, 1024] as [number, number],
  "shadow-bias": -0.0004,
  "shadow-normalBias": 0.03, // stops self-shadow striping on shelves and the blanket
  "shadow-camera-left": -4,
  "shadow-camera-right": 4,
  "shadow-camera-top": 4,
  "shadow-camera-bottom": -4,
};

function Lights({ night }: { night: boolean }) {
  return night ? (
    <>
      <ambientLight intensity={0.5} color="#7f86b8" />
      <hemisphereLight args={["#5a65a0", "#2a1a14", 0.3]} />
      {/* moonlight through the window */}
      <directionalLight position={[-7, 4.5, 1.2]} intensity={0.85} color="#9db4ff" {...shadowProps} />
      <directionalLight position={[6, 7, 6]} intensity={0.55} color="#ffd9b0" />
    </>
  ) : (
    <>
      <ambientLight intensity={0.9} color="#fff1dd" />
      <hemisphereLight args={["#fff6e8", "#8a6440", 0.45]} />
      <directionalLight position={[-7, 5.5, 1.2]} intensity={2.4} color="#ffe2b8" {...shadowProps} />
      <directionalLight position={[6, 7, 6]} intensity={0.9} color="#ffffff" />
    </>
  );
}

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

// Eases the camera between the overview and each spot, with gentle mouse parallax at home.
// While a side panel is open, the view shifts left so the object isn't hidden behind it.
function Rig({ focus, panelOpen }: { focus: SpotId | null; panelOpen: boolean }) {
  const target = useRef(new THREE.Vector3(...HOME.target));
  const shift = useRef(0);
  const lift = useRef(0);
  const size = useThree((s) => s.size);

  useFrame((state, dt) => {
    const view = (focus && SPOTS[focus].view) || HOME;
    const k = 1 - Math.exp(-dt * 3);
    tmpPos.set(...view.pos);
    // Narrow / portrait screens see less of the room sideways, so back the camera off along its view line.
    const aspect = size.width / size.height;
    const pull = focus
      ? THREE.MathUtils.clamp(Math.pow(1.55 / aspect, 0.55), 1, 1.7)
      : THREE.MathUtils.clamp(1.55 / aspect, 1, 2.5);
    if (pull > 1) tmpPos.sub(tmpTarget.set(...view.target)).multiplyScalar(pull).add(tmpTarget);
    if (!focus) {
      tmpPos.x += state.pointer.x * 0.3;
      tmpPos.y += state.pointer.y * 0.18;
    }
    state.camera.position.lerp(tmpPos, k);
    target.current.lerp(tmpTarget.set(...view.target), k);
    state.camera.lookAt(target.current);

    const cam = state.camera as THREE.PerspectiveCamera;
    // Keep the focused object visible beside the panel: side panel on desktop (shift left),
    // bottom sheet on phones (shift up).
    const wide = size.width > 900;
    const open = !!focus && panelOpen && focus !== "monitor";
    const wantShift = open && wide ? size.width * 0.22 : 0;
    const wantLift = open && !wide ? size.height * 0.24 : 0;
    shift.current = THREE.MathUtils.lerp(shift.current, wantShift, k);
    lift.current = THREE.MathUtils.lerp(lift.current, wantLift, k);
    if (shift.current > 0.5 || lift.current > 0.5)
      cam.setViewOffset(size.width, size.height, shift.current, lift.current, size.width, size.height);
    else cam.clearViewOffset();
  });
  return null;
}

// Positions the DOM station markers over their 3D anchors every frame (no per-marker React roots).
const proj = new THREE.Vector3();
function Projector({ markers }: { markers: React.RefObject<MarkerEls> }) {
  const size = useThree((s) => s.size);
  useFrame(({ camera }) => {
    for (const st of STATIONS) {
      const el = markers.current?.[st.id];
      if (!el) continue;
      proj.set(...st.marker).project(camera);
      const visible = proj.z < 1;
      el.style.transform = `translate(-50%, -50%) translate(${((proj.x + 1) / 2) * size.width}px, ${((1 - proj.y) / 2) * size.height}px)`;
      el.style.visibility = visible ? "" : "hidden";
    }
  });
  return null;
}

// Ink outlines on everything, drawn by three's OutlineEffect (it takes over rendering).
// Glass, screens, decals, glows and other unlit/transparent surfaces are skipped.
function Outlines() {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const effect = useMemo(
    () => new OutlineEffect(gl, { defaultThickness: 0.0035, defaultColor: [0.07, 0.06, 0.1], defaultAlpha: 1 }),
    [gl],
  );
  const tagged = useRef(new WeakSet<THREE.Material>());
  useFrame(({ scene, camera }) => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (tagged.current.has(m)) continue;
        tagged.current.add(m);
        const thin = mesh.geometry?.type === "PlaneGeometry" || mesh.geometry?.type === "CircleGeometry" || mesh.geometry?.type === "RingGeometry";
        if (m.transparent || m instanceof THREE.MeshBasicMaterial || thin) m.userData.outlineParameters = { visible: false };
        else if (size.width < 700) m.userData.outlineParameters = { thickness: 0.0045 }; // phones: a touch bolder so it survives downscaling
      }
    });
    effect.render(scene, camera);
  }, 1);
  return null;
}
