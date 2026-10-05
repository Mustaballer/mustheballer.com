// The study's character: a rigged toy-figure Mustafa built in Blender (art/character/build.py),
// played with an AnimationMixer like the three.js skinning examples.
//   Type    – typing at the desk (default loop)
//   Stretch – every so often, a big seated stretch
//   Wave    – swivels round and waves when you say hello (About), then Idle
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toToon } from "./toon";

const URL = "/models/mustafa.glb";
const STRETCH_EVERY = 18; // seconds of typing between stretches

export function Avatar({ look }: { look: boolean }) {
  const gltf = useLoader(GLTFLoader, URL);
  const model = useMemo(() => {
    const root = gltf.scene;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.frustumCulled = false; // rigid parts move with bones; skip per-part culling checks
      mesh.receiveShadow = true;
      mesh.material = toToon(mesh.material as THREE.Material);
    });
    return root;
  }, [gltf]);

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const actions = useMemo(() => {
    const get = (name: string) => {
      const clip = gltf.animations.find((c) => c.name === name);
      return clip ? mixer.clipAction(clip) : null;
    };
    const a = { Type: get("Type"), Idle: get("Idle"), Wave: get("Wave"), Stretch: get("Stretch") };
    for (const once of [a.Wave, a.Stretch]) {
      if (!once) continue;
      once.setLoop(THREE.LoopOnce, 1);
      once.clampWhenFinished = true;
    }
    return a;
  }, [gltf, mixer]);

  const current = useRef<THREE.AnimationAction | null>(null);
  const play = (next: THREE.AnimationAction | null, fade = 0.35) => {
    if (!next || next === current.current) return;
    next.reset().setEffectiveWeight(1).play();
    if (current.current) current.current.crossFadeTo(next, fade, false);
    current.current = next;
  };

  // typing by default; wave then idle while someone's saying hello
  useEffect(() => {
    if (look) {
      play(actions.Wave, 0.3);
      const t = window.setTimeout(() => play(actions.Idle, 0.4), 2000);
      return () => window.clearTimeout(t);
    }
    play(actions.Type, 0.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, actions]);

  // an occasional stretch while typing
  useEffect(() => {
    const id = window.setInterval(() => {
      if (current.current !== actions.Type) return;
      play(actions.Stretch, 0.4);
      window.setTimeout(() => current.current === actions.Stretch && play(actions.Type, 0.5), 2700);
    }, STRETCH_EVERY * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);

  // advance the mixer every frame (capped so a slow frame doesn't jump the pose)
  useFrame((_, dt) => mixer.update(Math.min(dt, 1 / 20)));

  // Blender units → room: scale 1.12 with the floor at y=0
  return <primitive object={model} scale={1.12} position={[0, -0.23, 0]} />;
}

useLoader.preload(GLTFLoader, URL);
