// Anime-style avatar: cel shading (3-step toon ramp) + inked outlines (inverted hull).
// Sits in the desk chair facing -z; `look` turns the head toward the room.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import * as THREE from "three";
import type { Vec3 } from "./spots";
import { uoftPrintTexture } from "./textures";

const INK = "#16121c";

// Three hard bands of light, the classic anime look.
function useToonRamp() {
  return useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array([150, 205, 255]), 3, 1, THREE.RedFormat);
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

const SKIN = "#b47c55"; // warm tan
const HAIR = "#2e211b"; // dark brown so the toon shading shows the shape
const HOODIE = "#14305f"; // U of T blue
const PANTS = "#3a3f52";

export function Avatar({ look }: { look: boolean }) {
  const ramp = useToonRamp();
  const print = useMemo(() => uoftPrintTexture(), []);
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

  // wayfarer-style lens outline (lens-local, metres), extruded into a thin 3D lens
  const lensGeo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.038, 0.019);
    sh.lineTo(0.038, 0.022);
    sh.quadraticCurveTo(0.041, -0.004, 0.022, -0.022);
    sh.lineTo(-0.018, -0.023);
    sh.quadraticCurveTo(-0.04, -0.016, -0.038, 0.019);
    return sh;
  }, []);

  // sunglasses arms: from each lens' outer edge back along the side of the head to the ear
  const glassArms = useMemo(
    () =>
      [-1, 1].map((sx) => {
        const a = new THREE.Vector3(sx * 0.088, 0.0, -0.118);
        const b = new THREE.Vector3(sx * 0.13, -0.004, -0.008);
        return {
          mid: a.clone().add(b).multiplyScalar(0.5).toArray() as Vec3,
          len: a.distanceTo(b),
          q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize()),
        };
      }),
    [],
  );

  return (
    <group ref={body}>
      {/* hoodie torso + hood bunched at the back */}
      <Part ramp={ramp} color={HOODIE} p={[0, 0.88, -0.02]} geom={<capsuleGeometry args={[0.16, 0.3, 8, 16]} />} />
      <Part ramp={ramp} color={HOODIE} p={[0, 1.13, 0.1]} s={[1.2, 0.7, 0.8]} geom={<sphereGeometry args={[0.11, 16, 12]} />} />
      {/* TORONTO / ENGINEERING chest print, on the front (-z) of the torso */}
      <mesh position={[0, 0.945, -0.181]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.24, 0.12]} />
        <meshBasicMaterial map={print} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* drawstrings */}
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x * 1.6, 1.075, -0.168]}>
          <cylinderGeometry args={[0.005, 0.005, 0.06, 6]} />
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
        {/* head: smooth, slightly long */}
        <Part ramp={ramp} color={SKIN} s={[0.93, 1.1, 0.98]} geom={<sphereGeometry args={[0.13, 48, 36]} />} />
        {/* ears */}
        {[-1, 1].map((sx) => (
          <Part key={sx} ramp={ramp} color={SKIN} p={[sx * 0.121, -0.008, 0.005]} s={[0.45, 1, 0.75]} geom={<sphereGeometry args={[0.03, 14, 12]} />} />
        ))}
        {/* hair: a combover — tapered sides, side part on his left, top swept up and over to the right */}
        {/* short tapered base: hairline raised at the front and sides */}
        <Part ramp={ramp} color={HAIR} p={[0, 0.03, 0.014]} r={[0.42, 0, 0]} s={[0.96, 1.0, 1.04]} outline={1.03} geom={<sphereGeometry args={[0.135, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.4]} />} />
        <Part ramp={ramp} color={HAIR} p={[0, 0.0, 0.02]} s={[0.95, 1.04, 0.98]} outline={1.03} geom={<sphereGeometry args={[0.133, 40, 24, 0, Math.PI, Math.PI * 0.3, Math.PI * 0.28]} />} />
        {/* the swept top: a long volume running front to back, leaning right */}
        <Part ramp={ramp} color={HAIR} p={[0.02, 0.122, 0.0]} r={[0.05, 0, -0.28]} s={[0.95, 0.42, 1.25]} outline={1.04} geom={<sphereGeometry args={[0.1, 36, 22]} />} />
        {/* the front: lifted and swept over to the right */}
        <Part ramp={ramp} color={HAIR} p={[0.03, 0.13, -0.088]} r={[-0.55, 0.15, -0.38]} s={[1.15, 0.5, 0.7]} outline={1.05} geom={<sphereGeometry args={[0.072, 30, 20]} />} />
        {/* side part on his left */}
        <mesh position={[-0.06, 0.126, -0.01]} rotation={[0.06, 0, 0.5]}>
          <boxGeometry args={[0.005, 0.008, 0.17]} />
          <meshBasicMaterial color="#120c0a" />
        </mesh>
        {/* sunglasses: two dark glossy lenses in black frames, angled to wrap the face, plus a bridge */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.047, -0.008, -0.133]} rotation={[0.05, sx * -0.32, 0]} scale={[sx, 1, 1]}>
            <mesh position={[0, 0, -0.0025]} scale={[1.14, 1.2, 1]}>
              <extrudeGeometry args={[lensGeo, { depth: 0.004, bevelEnabled: false }]} />
              <meshBasicMaterial color="#0b0b10" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, -0.0045]}>
              <extrudeGeometry args={[lensGeo, { depth: 0.002, bevelEnabled: false }]} />
              <meshStandardMaterial color="#25223a" roughness={0.08} metalness={0.4} side={THREE.DoubleSide} />
            </mesh>
            {/* glint */}
            <mesh position={[-0.012, 0.008, -0.0048]} rotation={[0, Math.PI, -0.4]}>
              <planeGeometry args={[0.022, 0.0035]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.006, -0.142]}>
          <boxGeometry args={[0.03, 0.007, 0.006]} />
          <meshBasicMaterial color="#0b0b10" />
        </mesh>
        {/* sunglasses arms */}
        {glassArms.map((g, i) => (
          <mesh key={i} position={g.mid} quaternion={g.q}>
            <boxGeometry args={[0.007, 0.011, g.len]} />
            <meshBasicMaterial color="#0b0b10" />
          </mesh>
        ))}
        {/* AirPods: bud tucked into each ear, short stem angled down toward the jaw */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.133, -0.012, -0.004]}>
            <mesh scale={[0.8, 1, 1]}>
              <sphereGeometry args={[0.011, 14, 12]} />
              <meshToonMaterial color="#fbfbf9" gradientMap={ramp} />
            </mesh>
            <mesh position={[0, -0.018, -0.006]} rotation={[0.35, 0, 0]}>
              <capsuleGeometry args={[0.0042, 0.022, 4, 10]} />
              <meshToonMaterial color="#fbfbf9" gradientMap={ramp} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
