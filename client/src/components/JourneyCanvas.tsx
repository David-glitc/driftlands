"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { EquippedArtifact, JourneyNode, JourneyStatus } from "@driftlands/shared";
import { DRIFTLANDS_PALETTE } from "@driftlands/shared";

type Props = {
  nodes: JourneyNode[];
  zoneIndex: number;
  status: JourneyStatus;
  inventory: EquippedArtifact[];
};

const HAZARD_COLOR: Record<string, string> = {
  cache: DRIFTLANDS_PALETTE.sun,
  storm: DRIFTLANDS_PALETTE.sky,
  ambush: DRIFTLANDS_PALETTE.magenta,
  fire: DRIFTLANDS_PALETTE.coral,
  fork: DRIFTLANDS_PALETTE.turquoise,
  checkpoint: DRIFTLANDS_PALETTE.success,
};

/** Low-poly coral dunes — instanced props, flat materials, FPS-friendly. */
export function JourneyCanvas({ nodes, zoneIndex, status }: Props) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", minHeight: "68vh" }}
    >
      <color attach="background" args={[DRIFTLANDS_PALETTE.sky]} />
      <fog attach="fog" args={[DRIFTLANDS_PALETTE.sky, 28, 90]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 14, 4]} intensity={1.15} color="#ffe08a" />
      <PerspectiveCamera makeDefault position={[0, 8, zoneIndex * 18 - 12]} fov={50} />
      <TerrainStrip />
      <HazardMarkers nodes={nodes} zoneIndex={zoneIndex} />
      <Wanderer zoneIndex={zoneIndex} status={status} />
      <CameraRig zoneIndex={zoneIndex} />
    </Canvas>
  );
}

function CameraRig({ zoneIndex }: { zoneIndex: number }) {
  useFrame((state) => {
    const targetZ = zoneIndex * 18 - 12;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.06);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, Math.sin(zoneIndex) * 1.5, 0.04);
    state.camera.lookAt(0, 1.2, zoneIndex * 18);
  });
  return null;
}

function TerrainStrip() {
  const dunes = useMemo(() => {
    const list: Array<{ x: number; z: number; s: number; c: string }> = [];
    for (let i = 0; i < 48; i++) {
      list.push({
        x: ((i * 17) % 37) - 18,
        z: (i % 12) * 18 + ((i * 3) % 7),
        s: 1.2 + (i % 5) * 0.35,
        c: i % 3 === 0 ? DRIFTLANDS_PALETTE.coral : i % 3 === 1 ? DRIFTLANDS_PALETTE.sandDeep : DRIFTLANDS_PALETTE.turquoise,
      });
    }
    return list;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 70]} receiveShadow={false}>
        <planeGeometry args={[80, 200]} />
        <meshStandardMaterial color={DRIFTLANDS_PALETTE.sand} flatShading />
      </mesh>
      {dunes.map((d, i) => (
        <mesh key={i} position={[d.x, d.s * 0.45, d.z]} castShadow={false}>
          <coneGeometry args={[d.s * 1.6, d.s, 5]} />
          <meshStandardMaterial color={d.c} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function HazardMarkers({ nodes, zoneIndex }: { nodes: JourneyNode[]; zoneIndex: number }) {
  return (
    <group>
      {nodes.map((node, i) => {
        const active = i === zoneIndex;
        const color = HAZARD_COLOR[node.kind] ?? DRIFTLANDS_PALETTE.sun;
        return (
          <Float key={node.nodeId} speed={active ? 2.2 : 1} floatIntensity={active ? 0.6 : 0.2}>
            <mesh position={[node.position.x, active ? 2.2 : 1.4, node.position.z]}>
              <icosahedronGeometry args={[active ? 1.1 : 0.7, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={active ? color : "#000000"}
                emissiveIntensity={active ? 0.35 : 0}
                flatShading
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function Wanderer({ zoneIndex, status }: { zoneIndex: number; status: JourneyStatus }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const z = zoneIndex * 18;
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, z, 0.08);
    ref.current.position.y = status === "awaiting_revive" ? 0.4 : 1 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
    ref.current.rotation.y += 0.02;
  });

  const color =
    status === "awaiting_revive"
      ? DRIFTLANDS_PALETTE.danger
      : status === "survived"
        ? DRIFTLANDS_PALETTE.success
        : DRIFTLANDS_PALETTE.ink;

  return (
    <mesh ref={ref} position={[0, 1, 0]}>
      <capsuleGeometry args={[0.45, 0.9, 4, 8]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}
