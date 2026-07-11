"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Sky,
  SoftShadows,
  Stars,
} from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { EquippedArtifact, JourneyNode, JourneyStatus } from "@driftlands/shared";

type Props = {
  nodes: JourneyNode[];
  zoneIndex: number;
  status: JourneyStatus;
  inventory: EquippedArtifact[];
};

const HAZARD: Record<
  string,
  { color: string; emissive: string; label: string }
> = {
  cache: { color: "#f0c14a", emissive: "#ffb020", label: "cache" },
  storm: { color: "#7ec8e8", emissive: "#4aa8d8", label: "storm" },
  ambush: { color: "#c45c7a", emissive: "#a03050", label: "ambush" },
  fire: { color: "#e85a2f", emissive: "#ff6a30", label: "fire" },
  fork: { color: "#3db8a8", emissive: "#2a9a8a", label: "fork" },
  checkpoint: { color: "#5ee0a0", emissive: "#30c878", label: "gate" },
};

/** High-definition coral desert — PBR materials, soft light, procedural dunes. */
export function JourneyCanvas({ nodes, zoneIndex, status }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      camera={{ position: [0, 9, -14], fov: 45, near: 0.1, far: 220 }}
      style={{ width: "100%", height: "100%", minHeight: "72vh", background: "#87c5e8" }}
    >
      <fog attach="fog" args={["#c8e4f5", 45, 140]} />
      <SoftShadows size={18} samples={12} focus={0.85} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#b1e1ff", "#d4a574", 0.55]} />
      <directionalLight
        castShadow
        position={[22, 28, 12]}
        intensity={2.2}
        color="#fff1d0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0002}
      />
      <Sky sunPosition={[80, 28, 40]} turbidity={4} rayleigh={1.2} mieCoefficient={0.005} mieDirectionalG={0.85} />
      <Stars radius={120} depth={40} count={1800} factor={2.2} saturation={0.2} fade speed={0.4} />
      <Environment preset="sunset" />

      <DesertTerrain length={nodes.length} />
      <PathRibbon nodes={nodes} />
      <RockField nodes={nodes} />
      <HazardLandmarks nodes={nodes} zoneIndex={zoneIndex} />
      <Wanderer zoneIndex={zoneIndex} status={status} nodes={nodes} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={80} blur={2.4} far={18} />
      <CameraRig zoneIndex={zoneIndex} nodes={nodes} status={status} />
    </Canvas>
  );
}

function CameraRig({
  zoneIndex,
  nodes,
  status,
}: {
  zoneIndex: number;
  nodes: JourneyNode[];
  status: JourneyStatus;
}) {
  const look = useRef(new THREE.Vector3());
  useFrame((state) => {
    const node = nodes[Math.min(zoneIndex, nodes.length - 1)];
    const z = node?.position.z ?? zoneIndex * 18;
    const x = node?.position.x ?? 0;
    const dead = status === "awaiting_revive";
    const targetCam = new THREE.Vector3(x * 0.35 + Math.sin(zoneIndex * 0.4) * 2.2, dead ? 5.5 : 8.5, z - 14);
    state.camera.position.lerp(targetCam, 0.045);
    look.current.lerp(new THREE.Vector3(x, 1.4, z + 2), 0.06);
    state.camera.lookAt(look.current);
  });
  return null;
}

function noise2(x: number, z: number) {
  return (
    Math.sin(x * 0.12) * Math.cos(z * 0.09) * 1.8 +
    Math.sin(x * 0.31 + 2.1) * Math.cos(z * 0.27) * 0.7 +
    Math.sin(x * 0.07 + z * 0.05) * 2.4
  );
}

function DesertTerrain({ length }: { length: number }) {
  const geo = useMemo(() => {
    const depth = Math.max(length * 18 + 40, 160);
    const g = new THREE.PlaneGeometry(90, depth, 96, Math.floor(depth / 2));
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = noise2(x, z);
      // Carve a softer valley along the path (x≈0)
      y *= 0.35 + Math.min(1, Math.abs(x) / 18);
      y += Math.max(0, (Math.abs(x) - 10) * 0.08);
      pos.setY(i, Math.max(-0.4, y));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [length]);

  return (
    <mesh geometry={geo} receiveShadow position={[0, 0, (length * 18) / 2]}>
      <meshStandardMaterial
        color="#e8c89a"
        roughness={0.92}
        metalness={0.02}
        envMapIntensity={0.35}
      />
    </mesh>
  );
}

function PathRibbon({ nodes }: { nodes: JourneyNode[] }) {
  const points = useMemo(
    () => nodes.map((n) => new THREE.Vector3(n.position.x * 0.15, 0.08, n.position.z)),
    [nodes],
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35), [points]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.55, 8, false), [curve]);

  return (
    <mesh geometry={tube} receiveShadow>
      <meshStandardMaterial color="#d4a574" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function RockField({ nodes }: { nodes: JourneyNode[] }) {
  const rocks = useMemo(() => {
    const list: Array<{ p: [number, number, number]; s: number; r: number }> = [];
    nodes.forEach((n, i) => {
      for (let k = 0; k < 3; k++) {
        const side = k % 2 === 0 ? 1 : -1;
        list.push({
          p: [n.position.x + side * (6 + (i % 3) * 1.4 + k), 0.4 + (k % 2) * 0.3, n.position.z + (k - 1) * 2.2],
          s: 0.6 + ((i + k) % 4) * 0.35,
          r: (i * 17 + k * 9) * 0.1,
        });
      }
    });
    return list;
  }, [nodes]);

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} castShadow receiveShadow position={r.p} rotation={[0.2, r.r, 0.1]} scale={r.s}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#c4a484" : "#b8956e"} roughness={0.95} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

function HazardLandmarks({ nodes, zoneIndex }: { nodes: JourneyNode[]; zoneIndex: number }) {
  return (
    <group>
      {nodes.map((node, i) => {
        const active = i === zoneIndex;
        const h = HAZARD[node.kind] ?? HAZARD.cache!;
        const y = active ? 2.4 : 1.6;
        return (
          <Float key={node.nodeId} speed={active ? 1.6 : 0.7} floatIntensity={active ? 0.35 : 0.12} rotationIntensity={0.15}>
            <group position={[node.position.x, y, node.position.z]}>
              <mesh castShadow>
                <icosahedronGeometry args={[active ? 1.05 : 0.72, 1]} />
                <meshStandardMaterial
                  color={h.color}
                  emissive={h.emissive}
                  emissiveIntensity={active ? 0.55 : 0.12}
                  roughness={0.35}
                  metalness={0.45}
                  envMapIntensity={1.2}
                />
              </mesh>
              {active && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -y + 0.05, 0]}>
                  <ringGeometry args={[1.4, 1.85, 48]} />
                  <meshStandardMaterial color={h.emissive} emissive={h.emissive} emissiveIntensity={0.8} transparent opacity={0.55} />
                </mesh>
              )}
              {/* Landmark pillar */}
              <mesh castShadow position={[1.8, -0.4, 0.4]}>
                <cylinderGeometry args={[0.18, 0.28, 2.2, 10]} />
                <meshStandardMaterial color="#c9b08a" roughness={0.9} />
              </mesh>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

function Wanderer({
  zoneIndex,
  status,
  nodes,
}: {
  zoneIndex: number;
  status: JourneyStatus;
  nodes: JourneyNode[];
}) {
  const group = useRef<THREE.Group>(null);
  const bob = useRef(0);

  useFrame((state, dt) => {
    if (!group.current) return;
    const node = nodes[Math.min(zoneIndex, nodes.length - 1)];
    const target = new THREE.Vector3(node?.position.x ?? 0, 0, node?.position.z ?? zoneIndex * 18);
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, target.x, 0.07);
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, target.z, 0.07);

    const moving =
      Math.abs(group.current.position.z - target.z) > 0.15 ||
      Math.abs(group.current.position.x - target.x) > 0.15;
    bob.current += dt * (moving ? 10 : 2);
    const dead = status === "awaiting_revive";
    group.current.position.y = dead ? 0.15 : 0.95 + Math.sin(bob.current) * (moving ? 0.08 : 0.03);
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      Math.atan2(target.x - group.current.position.x, target.z - group.current.position.z + 0.001),
      0.08,
    );
    if (dead) group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, Math.PI / 2, 0.08);
    else group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
  });

  const cloak =
    status === "awaiting_revive" ? "#8b2f3e" : status === "survived" ? "#2f9e6e" : "#2a3348";
  const trim = status === "survived" ? "#ffe08a" : "#e07a5f";

  return (
    <group ref={group} position={[0, 1, 0]}>
      {/* Body */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.32, 0.55, 8, 16]} />
        <meshStandardMaterial color={cloak} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#e8c4a8" roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Hood / scarf */}
      <mesh castShadow position={[0, 1.15, -0.05]}>
        <torusGeometry args={[0.3, 0.08, 12, 24]} />
        <meshStandardMaterial color={trim} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Pack */}
      <mesh castShadow position={[0, 0.7, -0.35]}>
        <boxGeometry args={[0.35, 0.4, 0.2]} />
        <meshStandardMaterial color="#5c4030" roughness={0.85} />
      </mesh>
    </group>
  );
}
