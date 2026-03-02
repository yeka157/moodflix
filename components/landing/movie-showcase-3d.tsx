"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  type MutableRefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ShowcasePoster } from "@/lib/tmdb";

interface MovieShowcase3DProps {
  posters: ShowcasePoster[];
  scrollProgressRef: MutableRefObject<number>;
}

// Cinematic staggered grid — organic offsets + inward rotation
function generatePositions(count: number) {
  const positions: Array<{
    x: number;
    y: number;
    z: number;
    rotY: number;
  }> = [];
  const cols = 5;
  const spacingX = 3.5;
  const spacingZ = 5;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = (col - (cols - 1) / 2) * spacingX;
    // Organic vertical offset — each poster at unique height
    const y = Math.sin(i * 1.7) * 0.5 + Math.cos(i * 0.9) * 0.25;
    const z = -row * spacingZ - 6;
    // Slight inward rotation — posters angle toward the viewer's flight path
    const rotY = (col - (cols - 1) / 2) * 0.06;
    positions.push({ x, y, z, rotY });
  }
  return positions;
}

// Fetch via same-origin proxy → blob URL → Image → Three.js texture
// Progressive: each texture updates state so posters appear one-by-one
function usePreloadedTextures(urls: string[]) {
  const [textures, setTextures] = useState<Map<string, THREE.Texture>>(
    new Map(),
  );

  useEffect(() => {
    let cancelled = false;

    urls.forEach(async (url) => {
      try {
        const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok || cancelled) return;

        const blob = await res.blob();
        if (cancelled) return;

        const objectUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (cancelled) return;

          const tex = new THREE.Texture(img);
          tex.needsUpdate = true;
          tex.colorSpace = THREE.SRGBColorSpace;

          setTextures((prev) => {
            const next = new Map(prev);
            next.set(url, tex);
            return next;
          });
        };
        img.onerror = () => URL.revokeObjectURL(objectUrl);
        img.src = objectUrl;
      } catch {
        // skip failed image
      }
    });

    return () => {
      cancelled = true;
    };
  }, [urls]);

  return textures;
}

function PosterPlane({
  texture,
  position,
  index,
  baseRotY,
  groupZRef,
}: {
  texture: THREE.Texture;
  position: [number, number, number];
  index: number;
  baseRotY: number;
  groupZRef: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const mat = materialRef.current;
    if (!mesh || !mat) return;

    const t = clock.getElapsedTime();

    // Gentle floating — unique phase per poster so they feel alive
    mesh.position.y =
      position[1] + Math.sin(t * 0.4 + index * 1.3) * 0.1;
    mesh.position.x =
      position[0] + Math.cos(t * 0.25 + index * 0.7) * 0.03;

    // How close is this poster to the sweet spot in front of the camera?
    // Camera sits at z=6, sweet spot at z≈3 (slightly ahead)
    const worldZ = position[2] + groupZRef.current;
    const dist = Math.abs(worldZ - 3);
    const proximity = THREE.MathUtils.clamp(1 - dist / 18, 0, 1);

    // Scale: subtle grow as posters approach
    const scale = 1 + proximity * 0.1;
    mesh.scale.set(scale, scale, 1);

    // Opacity: smoothly fade in from the fog
    mat.opacity = THREE.MathUtils.smoothstep(proximity, 0.05, 0.35);

  });

  return (
    <mesh ref={meshRef} position={position} rotation={[0, baseRotY, 0]}>
      <planeGeometry args={[2, 3]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}

function PosterField({
  posters,
  textures,
  scrollProgressRef,
}: {
  posters: ShowcasePoster[];
  textures: Map<string, THREE.Texture>;
  scrollProgressRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const smoothZ = useRef(0);
  const positions = useMemo(
    () => generatePositions(posters.length),
    [posters.length],
  );

  const totalDepth = 24;

  useFrame(() => {
    if (!groupRef.current) return;
    const targetZ = scrollProgressRef.current * totalDepth;
    // Buttery lerp — lower factor = smoother, dreamier lag
    smoothZ.current = THREE.MathUtils.lerp(smoothZ.current, targetZ, 0.035);
    groupRef.current.position.z = smoothZ.current;
  });

  return (
    <group ref={groupRef}>
      {posters.map((poster, i) => {
        const pos = positions[i];
        const tex = textures.get(poster.posterUrl);
        if (!pos || !tex) return null;
        return (
          <PosterPlane
            key={`poster-${i}`}
            texture={tex}
            position={[pos.x, pos.y, pos.z]}
            index={i}
            baseRotY={pos.rotY}
            groupZRef={smoothZ}
          />
        );
      })}
    </group>
  );
}

export function MovieShowcase3D({
  posters,
  scrollProgressRef,
}: MovieShowcase3DProps) {
  const urls = useMemo(() => posters.map((p) => p.posterUrl), [posters]);
  const textures = usePreloadedTextures(urls);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#1a0a0a", 8, 36]} />
      <PosterField
        posters={posters}
        textures={textures}
        scrollProgressRef={scrollProgressRef}
      />
    </Canvas>
  );
}
