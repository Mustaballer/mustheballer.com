// Anime-style avatar: cel shading (3-step toon ramp) + inked outlines (inverted hull).
// Sits in the desk chair facing -z; `look` turns the head toward the room.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import * as THREE from "three";
import type { Vec3 } from "./spots";
import { faceTexture } from "./textures";

const INK = "#16121c";

// Three hard bands of light, the classic anime look.
function useToonRamp() {
  return useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  }, []);
}

type PartProps = {
  geom: ReactElement;
  color: string;
  ramp: THREE.Texture;
  p?: Vec3;
  r?: Vec3;
  s?: Vec3;
  q?: THREE.Quaternion;
  outline?: number; // outline thickness as a scale factor
};

// A toon-shaded mesh with a back-face "ink" shell around it.
function Part({ geom, color, ramp, p, r, s, q, outline = 1.06 }: PartProps) {
  const base: Vec3 = s ?? [1, 1, 1];
  return (
    <group position={p} rotation={r} quaternion={q}>
      <mesh scale={base} castShadow>
        {geom}
        <meshToonMaterial color={color} gradientMap={ramp} />
      </mesh>
      {outline > 0 && (
        <mesh scale={[base[0] * outline, base[1] * outline, base[2] * outline]}>
          {geom}
          <meshBasicMaterial color={INK} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

const SKIN = "#c9956f";
const HAIR = "#1b1620";
const HOODIE = "#2b2d3a";
const PANTS = "#3a3f52";

export function Avatar({ look }: { look: boolean }) {
  const ramp = useToonRamp();
  const face = useMemo(() => faceTexture(), []);
  const head = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    body.current.position.y = Math.sin(t * 1.6) * 0.006;
    const want = look ? -0.35 : Math.sin(t * 0.3) * 0.08; // the chair does most of the turning
    head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, want, 0.08);
    head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, look ? -0.08 : 0.05, 0.08);
  });

  // arms: shoulder → hands on keyboard / mouse, or resting on the lap when turned around
  const typing = [
    { from: [-0.19, 1.04, 0], to: [-0.1, 0.82, -0.58] },
    { from: [0.19, 1.04, 0], to: [0.5, 0.8, -0.58] },
  ];
  const resting = [
    { from: [-0.19, 1.04, 0], to: [-0.11, 0.68, -0.27] },
    { from: [0.19, 1.04, 0], to: [0.11, 0.68, -0.27] },
  ];
  const arms = useMemo(
    () =>
      (look ? resting : typing).map(({ from, to }) => {
        const a = new THREE.Vector3(...(from as Vec3));
        const b = new THREE.Vector3(...(to as Vec3));
        return {
          mid: a.clone().add(b).multiplyScalar(0.5).toArray() as Vec3,
          len: a.distanceTo(b),
          q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()),
          hand: b.toArray() as Vec3,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [look],
  );

  // messy, swept hair: tufts around the crown plus a fringe over the forehead
  const tufts = useMemo(() => {
    const out: { p: Vec3; r: Vec3; s: number }[] = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      out.push({
        p: [Math.cos(a) * 0.1, 0.07 + (i % 3) * 0.012, Math.sin(a) * 0.1 + 0.015],
        r: [Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1],
        s: 0.8 + (i % 4) * 0.12,
      });
    }
    // fringe (front is -z)
    [-0.07, -0.025, 0.025, 0.07].forEach((x, i) =>
      out.push({ p: [x, 0.075, -0.1], r: [-2.55, 0, (i - 1.5) * 0.3], s: 0.6 + (i % 2) * 0.12 }),
    );
    return out;
  }, []);

  return (
    <group ref={body}>
      {/* hoodie torso + hood bunched at the back */}
      <Part ramp={ramp} color={HOODIE} p={[0, 0.88, -0.02]} geom={<capsuleGeometry args={[0.16, 0.3, 8, 16]} />} />
      <Part ramp={ramp} color={HOODIE} p={[0, 1.13, 0.1]} s={[1.2, 0.7, 0.8]} geom={<sphereGeometry args={[0.11, 16, 12]} />} />
      {/* drawstrings */}
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 1.02, -0.17]}>
          <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
          <meshToonMaterial color="#e8e4dc" gradientMap={ramp} />
        </mesh>
      ))}
      {/* legs */}
      {[-0.09, 0.09].map((x) => (
        <Part key={x} ramp={ramp} color={PANTS} p={[x, 0.6, -0.21]} r={[Math.PI / 2, 0, 0]} geom={<capsuleGeometry args={[0.06, 0.28, 6, 12]} />} />
      ))}
      {/* arms and hands */}
      {arms.map((a, i) => (
        <group key={i}>
          <Part ramp={ramp} color={HOODIE} p={a.mid} q={a.q} geom={<capsuleGeometry args={[0.048, a.len - 0.1, 6, 12]} />} />
          <Part ramp={ramp} color={SKIN} p={a.hand} geom={<sphereGeometry args={[0.04, 12, 12]} />} />
        </group>
      ))}
      {/* neck */}
      <Part ramp={ramp} color={SKIN} p={[0, 1.2, -0.03]} outline={0} geom={<cylinderGeometry args={[0.045, 0.05, 0.1, 12]} />} />

      <group ref={head} position={[0, 1.36, -0.04]} scale={1.14}>
        {/* slightly tall anime head */}
        <Part ramp={ramp} color={SKIN} s={[0.95, 1.1, 1]} geom={<sphereGeometry args={[0.13, 28, 22]} />} />
        {/* jaw and chin */}
        <Part ramp={ramp} color={SKIN} p={[0, -0.085, -0.005]} s={[0.78, 0.6, 0.8]} geom={<sphereGeometry args={[0.11, 20, 16]} />} />
        {/* drawn face on the front (-z) */}
        <mesh scale={[0.95, 1.1, 1]}>
          <sphereGeometry args={[0.1315, 32, 20, Math.PI * 1.5 - 0.82, 1.64, Math.PI / 2 - 0.62, 1.3]} />
          <meshBasicMaterial map={face} transparent depthWrite={false} />
        </mesh>
        {/* ears */}
        {[-1, 1].map((sx) => (
          <Part key={sx} ramp={ramp} color={SKIN} p={[sx * 0.128, -0.005, 0]} s={[0.5, 1, 0.8]} geom={<sphereGeometry args={[0.03, 10, 10]} />} />
        ))}
        {/* hair: cap + tufts */}
        <Part ramp={ramp} color={HAIR} p={[0, 0.045, 0.015]} s={[1.08, 0.95, 1.1]} geom={<sphereGeometry args={[0.135, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.42]} />} />
        <Part ramp={ramp} color={HAIR} p={[0, -0.01, 0.03]} s={[1.06, 1, 0.95]} geom={<sphereGeometry args={[0.135, 20, 14, 0, Math.PI, Math.PI * 0.25, Math.PI * 0.5]} />} />
        {tufts.map((t, i) => (
          <Part key={i} ramp={ramp} color={HAIR} p={t.p} r={t.r} s={[t.s, t.s, t.s]} outline={1.12} geom={<coneGeometry args={[0.04, 0.11, 6]} />} />
        ))}
        {/* white headphones */}
        <Part ramp={ramp} color="#f4f2ee" p={[0, 0.03, 0.01]} outline={1.04} geom={<torusGeometry args={[0.152, 0.013, 8, 28, Math.PI]} />} />
        {[-0.142, 0.142].map((x) => (
          <Part key={x} ramp={ramp} color="#f4f2ee" p={[x, -0.01, 0.005]} r={[0, 0, Math.PI / 2]} geom={<cylinderGeometry args={[0.05, 0.05, 0.04, 18]} />} />
        ))}
      </group>
    </group>
  );
}
