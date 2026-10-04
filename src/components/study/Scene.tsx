import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Room } from "./Room";
import type { SpotId } from "./spots";
import { HOME, SPOTS } from "./spots";

type Props = {
  focus: SpotId | null;
  night: boolean;
  onSelect: (id: SpotId) => void;
  onReady: () => void;
};

export default function Scene({ focus, night, onSelect, onReady }: Props) {
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

  return (
    <Canvas
      className="study__canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 38, near: 0.05, far: 60, position: [10, 7, 11] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => (document.body.style.cursor = "")}
    >
      <color attach="background" args={[night ? "#0c0a10" : "#e9e1d3"]} />
      <fog attach="fog" args={[night ? "#0c0a10" : "#e9e1d3", 14, 26]} />
      <Lights night={night} />
      {fonts && (
        <>
          <Room night={night} onSelect={onSelect} />
          <Ready onReady={onReady} />
        </>
      )}
      <Rig focus={focus} />
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

function Lights({ night }: { night: boolean }) {
  return night ? (
    <>
      <ambientLight intensity={0.35} color="#7d84b8" />
      <hemisphereLight args={["#4a5590", "#2a1a14", 0.45]} />
      {/* moonlight through the window */}
      <directionalLight
        position={[-8, 5, 0.5]}
        intensity={0.7}
        color="#9db4ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {/* soft key so the room reads from the default camera */}
      <directionalLight position={[6, 7, 6]} intensity={0.35} color="#ffd9b0" />
    </>
  ) : (
    <>
      <ambientLight intensity={0.9} color="#fff1dd" />
      <hemisphereLight args={["#fff6e8", "#8a6440", 0.7]} />
      <directionalLight
        position={[-8, 6, 1]}
        intensity={2.4}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[6, 7, 6]} intensity={0.6} color="#ffffff" />
    </>
  );
}

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

// Eases the camera between the overview and each object, with gentle mouse parallax at home.
// While a side panel is open, the view is shifted left so the object isn't hidden behind it.
function Rig({ focus }: { focus: SpotId | null }) {
  const target = useRef(new THREE.Vector3(...HOME.target));
  const shift = useRef(0);
  const size = useThree((s) => s.size);

  useFrame((state, dt) => {
    const view = (focus && SPOTS[focus].view) || HOME;
    const k = 1 - Math.exp(-dt * 2.4);
    tmpPos.set(...view.pos);
    if (!focus) {
      tmpPos.x += state.pointer.x * 0.4;
      tmpPos.y += state.pointer.y * 0.25;
    }
    state.camera.position.lerp(tmpPos, k);
    target.current.lerp(tmpTarget.set(...view.target), k);
    state.camera.lookAt(target.current);

    const cam = state.camera as THREE.PerspectiveCamera;
    const wantShift = focus && focus !== "monitor" && size.width > 900 ? size.width * 0.22 : 0;
    shift.current = THREE.MathUtils.lerp(shift.current, wantShift, k);
    if (shift.current > 0.5) cam.setViewOffset(size.width, size.height, shift.current, 0, size.width, size.height);
    else cam.clearViewOffset();
  });
  return null;
}
