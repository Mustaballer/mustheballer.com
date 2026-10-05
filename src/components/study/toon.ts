// Shared cel-shading setup: one 3-band light ramp for every toon material in the study.
import * as THREE from "three";

let ramp: THREE.DataTexture | null = null;

/** Three hard bands of light (shadow, mid, lit), sampled without filtering. */
export function toonRamp() {
  if (!ramp) {
    ramp = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
    ramp.generateMipmaps = false;
    ramp.needsUpdate = true;
  }
  return ramp;
}

/** Swap a standard/physical material for a toon one, keeping colour, maps, emissive and transparency. */
export function toToon(m: THREE.Material): THREE.Material {
  if (!(m instanceof THREE.MeshStandardMaterial)) return m;
  const t = new THREE.MeshToonMaterial({
    color: m.color,
    map: m.map,
    emissive: m.emissive,
    emissiveMap: m.emissiveMap,
    emissiveIntensity: m.emissiveIntensity,
    transparent: m.transparent,
    opacity: m.opacity,
    side: m.side,
    gradientMap: toonRamp(),
  });
  t.name = m.name;
  return t;
}

/** Hide the ink outline on things that shouldn't have one (glass, screens, decals, glows). */
export function noOutline(m: THREE.Material) {
  m.userData.outlineParameters = { visible: false };
}
