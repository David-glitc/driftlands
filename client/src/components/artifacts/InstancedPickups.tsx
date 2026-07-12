"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { EquippedArtifact, JourneyNode } from "@driftlands/shared";
import { ARTIFACT_DEFINITIONS, getArtifactById } from "@driftlands/shared";
import { ArtifactMesh } from "./EquippedGear";

function pickPreviewId(node: JourneyNode): string {
  const eligible = ARTIFACT_DEFINITIONS.filter((a) => a.minJourneyZone <= node.zone);
  const list = eligible.length ? eligible : ARTIFACT_DEFINITIONS;
  const idx = Math.abs(node.zone * 17 + node.label.length * 3) % list.length;
  return list[idx]!.artifactId;
}

/**
 * Always-visible world fragment props at cache/hazard nodes (shaders readable from the path).
 * Collected zones keep a smaller marker; unvisited nodes float a full preview.
 */
export function WorldArtifactProps({
  nodes,
  inventory,
  zoneIndex,
}: {
  nodes: JourneyNode[];
  inventory: EquippedArtifact[];
  zoneIndex: number;
}) {
  const collectedZones = useMemo(() => {
    const set = new Set<number>();
    for (const item of inventory) set.add(item.acquiredAtZone);
    return set;
  }, [inventory]);

  return (
    <group>
      {nodes.map((node) => {
        if (node.kind === "checkpoint" || node.kind === "fork") return null;
        const collected = collectedZones.has(node.zone);
        const aheadOrHere = node.zone >= zoneIndex - 1;
        if (!aheadOrHere && !collected) return null;

        const artifactId = collected
          ? inventory.find((i) => i.acquiredAtZone === node.zone)?.artifactId ?? pickPreviewId(node)
          : pickPreviewId(node);
        const def = getArtifactById(artifactId);
        const active = node.zone === zoneIndex;
        const scale = collected ? 0.95 : active ? 1.85 : 1.45;

        return (
          <group
            key={`world-loot-${node.nodeId}`}
            position={[node.position.x * 0.12 + 1.55, active ? 2.35 : 1.85, node.position.z]}
          >
            <ArtifactMesh artifactId={artifactId} floating scale={scale} />
            <pointLight
              color={def?.color ?? "#ffd166"}
              intensity={active ? 2.4 : collected ? 0.6 : 1.2}
              distance={8}
              decay={2}
            />
            {active && !collected && <LootBeacon color={def?.color ?? "#ffd166"} />}
          </group>
        );
      })}
    </group>
  );
}

function LootBeacon({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.004;
    ref.current.scale.setScalar(1.2 + Math.sin(t) * 0.25);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.2 + Math.sin(t) * 0.08;
  });
  return (
    <mesh ref={ref} position={[0, -0.2, 0]}>
      <sphereGeometry args={[0.55, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}

/** Big highlight when a drop just landed at the active zone. */
export function ActiveLootBurst({
  artifactId,
  zoneIndex,
  nodes,
}: {
  artifactId: string | null;
  zoneIndex: number;
  nodes: JourneyNode[];
}) {
  if (!artifactId) return null;
  const node = nodes[Math.min(zoneIndex, nodes.length - 1)];
  if (!node) return null;
  const def = getArtifactById(artifactId);
  return (
    <group position={[node.position.x * 0.12, 3.1, node.position.z]}>
      <ArtifactMesh artifactId={artifactId} floating scale={2.4} />
      <pointLight color={def?.color ?? "#ffd166"} intensity={4} distance={14} decay={2} />
      <mesh>
        <ringGeometry args={[0.9, 1.15, 40]} />
        <meshBasicMaterial color={def?.color ?? "#ffd166"} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}


