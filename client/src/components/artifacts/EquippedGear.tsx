"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getArtifactById, topEquippedForBelt, type EquippedArtifact } from "@driftlands/shared";
import { createArtifactMaterial } from "./artifactMaterials";

type MeshProps = {
  artifactId: string;
  scale?: number;
  floating?: boolean;
};

function CategoryMesh({
  category,
  material,
}: {
  category: "armor" | "food" | "tool" | "charm";
  material: THREE.Material;
}) {
  switch (category) {
    case "armor":
      return (
        <mesh castShadow material={material}>
          <boxGeometry args={[0.55, 0.62, 0.22]} />
        </mesh>
      );
    case "food":
      return (
        <mesh castShadow material={material}>
          <cylinderGeometry args={[0.18, 0.2, 0.42, 14]} />
        </mesh>
      );
    case "tool":
      return (
        <mesh castShadow material={material} rotation={[0, 0, Math.PI / 8]}>
          <coneGeometry args={[0.18, 0.72, 8]} />
        </mesh>
      );
    case "charm":
    default:
      return (
        <mesh castShadow material={material}>
          <icosahedronGeometry args={[0.32, 1]} />
        </mesh>
      );
  }
}

export function ArtifactMesh({ artifactId, scale = 1, floating = false }: MeshProps) {
  const def = getArtifactById(artifactId);
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(() => {
    if (!def) return new THREE.MeshStandardMaterial({ color: "#ffd166", emissive: "#ffd166", emissiveIntensity: 0.2 });
    return createArtifactMaterial(def.artifactId, def.rank, def.color);
  }, [def]);

  useFrame(() => {
    if (group.current && floating) {
      group.current.rotation.y += 0.025;
      group.current.position.y = 0.2 + Math.sin(performance.now() * 0.0035) * 0.12;
    }
    if (mat instanceof THREE.MeshStandardMaterial) {
      const pulse =
        def?.rank === "legendary"
          ? 0.55 + Math.sin(performance.now() * 0.004) * 0.35
          : def?.rank === "epic"
            ? 0.28 + Math.sin(performance.now() * 0.003) * 0.12
            : def?.rank === "rare"
              ? 0.18
              : 0.08;
      mat.emissiveIntensity = pulse;
    }
  });

  if (!def) return null;

  return (
    <group ref={group} scale={scale}>
      <CategoryMesh category={def.category} material={mat} />
      <mesh scale={1.55}>
        <sphereGeometry args={[0.28, 14, 14]} />
        <meshBasicMaterial
          color={def.color}
          transparent
          opacity={def.rank === "legendary" ? 0.28 : def.rank === "common" ? 0.1 : 0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

const SLOT_OFFSETS: [number, number, number][] = [
  [0, 0.72, -0.55],
  [0.42, 0.62, 0.12],
  [-0.42, 0.62, 0.12],
  [0.28, 1.15, 0.22],
];

/** Attach top belt artifacts to the wanderer — oversized so shaders read on camera. */
export function EquippedGear({ inventory }: { inventory: EquippedArtifact[] }) {
  const belt = topEquippedForBelt(inventory, 4);

  return (
    <group>
      {belt.map((item, i) => (
        <group key={item.instanceId} position={SLOT_OFFSETS[i] ?? [0, 0.7, -0.5]} scale={1.15}>
          <ArtifactMesh artifactId={item.artifactId} />
        </group>
      ))}
    </group>
  );
}
