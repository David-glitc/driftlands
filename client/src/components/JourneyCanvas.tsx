"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Sky,
  Stars,
} from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { EquippedArtifact, JourneyNode, JourneyStatus } from "@driftlands/shared";
import { EquippedGear, WorldArtifactProps, ActiveLootBurst } from "@/components/artifacts";
import type { GraphicsQuality } from "@/lib/settings";

type Props = {
  nodes: JourneyNode[];
  zoneIndex: number;
  status: JourneyStatus;
  inventory: EquippedArtifact[];
  latestDropId?: string | null;
  graphicsQuality?: GraphicsQuality;
  reducedMotion?: boolean;
  cameraShake?: boolean;
};

const HAZARD: Record<string, { color: string; emissive: string }> = {
  cache: { color: "#f2c14e", emissive: "#ff9f1c" },
  storm: { color: "#8ecae6", emissive: "#219ebc" },
  ambush: { color: "#e76f51", emissive: "#9b2226" },
  fire: { color: "#f4a261", emissive: "#e76f51" },
  fork: { color: "#2a9d8f", emissive: "#1d6f66" },
  checkpoint: { color: "#52b788", emissive: "#2d6a4f" },
};

function makeSandTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = 180 + ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 50;
    const v = Math.max(120, Math.min(245, n + (i % 17) - 8));
    const o = i * 4;
    img.data[o] = v + 20;
    img.data[o + 1] = v - 5;
    img.data[o + 2] = v - 40;
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // Soft dunes wash
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${200 + (i % 30)}, ${160 + (i % 20)}, ${100 + (i % 15)}, 0.04)`;
    ctx.beginPath();
    ctx.ellipse((i * 97) % size, (i * 53) % size, 40 + (i % 20), 18 + (i % 10), i, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 28);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Cinematic desert journey — textured dunes, filmic light, third-person chase cam. */
export function JourneyCanvas({
  nodes,
  zoneIndex,
  status,
  inventory,
  latestDropId = null,
  graphicsQuality = "high",
  reducedMotion = false,
  cameraShake = true,
}: Props) {
  const dpr: [number, number] =
    graphicsQuality === "low" ? [1, 1] : graphicsQuality === "medium" ? [1, 1.5] : [1, 2];
  const starCount = graphicsQuality === "low" ? 400 : graphicsQuality === "medium" ? 1200 : 2200;
  const shadowMap = graphicsQuality === "low" ? 1024 : 2048;

  return (
    <Canvas
      shadows={graphicsQuality !== "low"}
      dpr={dpr}
      gl={{
        antialias: graphicsQuality !== "low",
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ fov: 42, near: 0.1, far: 260, position: [0, 6, -12] }}
      style={{ width: "100%", height: "100%", minHeight: "100vh", background: "#9ec9e8" }}
    >
      <color attach="background" args={["#9ec9e8"]} />
      <fog attach="fog" args={["#c5dff0", 55, 160]} />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#d7efff", "#c4a574", 0.65]} />
      <directionalLight
        castShadow={graphicsQuality !== "low"}
        position={[30, 40, 18]}
        intensity={2.6}
        color="#fff3d6"
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-camera-far={140}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.00015}
      />
      <Sky sunPosition={[100, 40, 50]} turbidity={3.2} rayleigh={0.85} mieCoefficient={0.004} mieDirectionalG={0.9} />
      <Stars radius={140} depth={50} count={starCount} factor={2} saturation={0.15} fade speed={reducedMotion ? 0 : 0.25} />
      {graphicsQuality === "high" && <Environment preset="sunset" />}

      <DesertTerrain length={nodes.length} />
      <PathRibbon nodes={nodes} />
      <RockField nodes={nodes} />
      <DistantMesas />
      <HazardLandmarks nodes={nodes} zoneIndex={zoneIndex} />
      <WorldArtifactProps nodes={nodes} inventory={inventory} zoneIndex={zoneIndex} />
      <ActiveLootBurst artifactId={latestDropId} zoneIndex={zoneIndex} nodes={nodes} />
      <Wanderer zoneIndex={zoneIndex} status={status} nodes={nodes} inventory={inventory} />
      {graphicsQuality !== "low" && (
        <ContactShadows position={[0, 0.02, 0]} opacity={0.55} scale={90} blur={2.8} far={22} />
      )}
      <ChaseCamera
        zoneIndex={zoneIndex}
        nodes={nodes}
        status={status}
        reducedMotion={reducedMotion}
        cameraShake={cameraShake}
      />
    </Canvas>
  );
}

function ChaseCamera({
  zoneIndex,
  nodes,
  status,
  reducedMotion = false,
  cameraShake = true,
}: {
  zoneIndex: number;
  nodes: JourneyNode[];
  status: JourneyStatus;
  reducedMotion?: boolean;
  cameraShake?: boolean;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const node = nodes[Math.min(zoneIndex, nodes.length - 1)];
    const next = nodes[Math.min(zoneIndex + 1, nodes.length - 1)];
    const px = node?.position.x ?? 0;
    const pz = node?.position.z ?? 0;
    const nx = next?.position.x ?? px;
    const nz = (next?.position.z ?? pz) + 0.01;
    const dir = new THREE.Vector3(nx - px, 0, nz - pz).normalize();
    const dead = status === "awaiting_revive";
    const ease = reducedMotion ? 8 : 2.4;
    const shake = !reducedMotion && cameraShake && !dead ? Math.sin(performance.now() * 0.0015) * 0.08 : 0;

    target.current.set(
      px - dir.x * 11 + dir.z * 2.2 + shake,
      dead ? 4.2 : 5.8,
      pz - dir.z * 11 - dir.x * 2.2,
    );
    camera.position.lerp(target.current, 1 - Math.exp(-ease * dt));
    look.current.lerp(new THREE.Vector3(px + dir.x * 6, 1.2, pz + dir.z * 6), 1 - Math.exp(-(ease + 0.6) * dt));
    camera.lookAt(look.current);
  });
  return null;
}

function noise2(x: number, z: number) {
  return (
    Math.sin(x * 0.09) * Math.cos(z * 0.07) * 2.6 +
    Math.sin(x * 0.23 + 1.7) * Math.cos(z * 0.19) * 1.1 +
    Math.sin(x * 0.05 + z * 0.04) * 3.2
  );
}

function DesertTerrain({ length }: { length: number }) {
  const sandMap = useMemo(() => makeSandTexture(), []);
  const geo = useMemo(() => {
    const depth = Math.max(length * 18 + 50, 180);
    const g = new THREE.PlaneGeometry(110, depth, 128, Math.floor(depth / 1.6));
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = noise2(x, z);
      const valley = Math.min(1, Math.abs(x) / 16);
      y *= 0.25 + valley * 0.9;
      y += Math.max(0, (Math.abs(x) - 12) * 0.12);
      pos.setY(i, Math.max(-0.5, y));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [length]);

  useLayoutEffect(() => () => sandMap.dispose(), [sandMap]);

  return (
    <mesh geometry={geo} receiveShadow position={[0, 0, (length * 18) / 2]}>
      <meshStandardMaterial
        map={sandMap}
        color="#f0d5a8"
        roughness={0.95}
        metalness={0.02}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}

function PathRibbon({ nodes }: { nodes: JourneyNode[] }) {
  const points = useMemo(
    () => nodes.map((n) => new THREE.Vector3(n.position.x * 0.12, 0.12, n.position.z)),
    [nodes],
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4), [points]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 96, 0.7, 10, false), [curve]);

  return (
    <mesh geometry={tube} receiveShadow>
      <meshStandardMaterial color="#c9a06a" roughness={0.88} metalness={0.04} />
    </mesh>
  );
}

function DistantMesas() {
  const mesas = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: (i % 2 === 0 ? 1 : -1) * (28 + (i % 4) * 4),
        z: 20 + i * 16,
        h: 4 + (i % 5) * 1.4,
        w: 3 + (i % 3),
      })),
    [],
  );
  return (
    <group>
      {mesas.map((m, i) => (
        <mesh key={i} castShadow receiveShadow position={[m.x, m.h / 2, m.z]}>
          <boxGeometry args={[m.w, m.h, m.w * 0.8]} />
          <meshStandardMaterial color={i % 2 ? "#d4a373" : "#c0895c"} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function RockField({ nodes }: { nodes: JourneyNode[] }) {
  const rocks = useMemo(() => {
    const list: Array<{ p: [number, number, number]; s: [number, number, number]; r: number }> = [];
    nodes.forEach((n, i) => {
      for (let k = 0; k < 4; k++) {
        const side = k % 2 === 0 ? 1 : -1;
        list.push({
          p: [
            n.position.x + side * (7 + (i % 3) * 1.6 + k * 0.4),
            0.35,
            n.position.z + (k - 1.5) * 2.4,
          ],
          s: [0.7 + ((i + k) % 3) * 0.4, 0.5 + (k % 3) * 0.35, 0.6 + ((i + k) % 2) * 0.4],
          r: (i * 13 + k * 7) * 0.15,
        });
      }
    });
    return list;
  }, [nodes]);

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} castShadow receiveShadow position={r.p} rotation={[0.15, r.r, 0.08]} scale={r.s}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#b08968" : "#9c7a55"}
            roughness={0.96}
            metalness={0.03}
          />
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
        return (
          <Float
            key={node.nodeId}
            speed={active ? 1.4 : 0.6}
            floatIntensity={active ? 0.25 : 0.08}
            rotationIntensity={0.1}
          >
            <group position={[node.position.x * 0.12, active ? 2.1 : 1.5, node.position.z]}>
              <mesh castShadow>
                <icosahedronGeometry args={[active ? 0.85 : 0.55, 1]} />
                <meshPhysicalMaterial
                  color={h.color}
                  emissive={h.emissive}
                  emissiveIntensity={active ? 0.65 : 0.15}
                  roughness={0.25}
                  metalness={0.55}
                  clearcoat={0.4}
                  clearcoatRoughness={0.3}
                />
              </mesh>
              {active && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, 0]}>
                  <ringGeometry args={[1.2, 1.55, 48]} />
                  <meshStandardMaterial
                    color={h.emissive}
                    emissive={h.emissive}
                    emissiveIntensity={0.9}
                    transparent
                    opacity={0.5}
                  />
                </mesh>
              )}
              <mesh castShadow position={[1.6, -0.6, 0.5]}>
                <cylinderGeometry args={[0.16, 0.26, 2.4, 12]} />
                <meshStandardMaterial color="#cbb089" roughness={0.9} />
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
  inventory,
}: {
  zoneIndex: number;
  status: JourneyStatus;
  nodes: JourneyNode[];
  inventory: EquippedArtifact[];
}) {
  const group = useRef<THREE.Group>(null);
  const bob = useRef(0);

  useFrame((_, dt) => {
    if (!group.current) return;
    const node = nodes[Math.min(zoneIndex, nodes.length - 1)];
    const tx = (node?.position.x ?? 0) * 0.12;
    const tz = node?.position.z ?? zoneIndex * 18;
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, tx, 0.08);
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, tz, 0.08);

    const moving =
      Math.hypot(group.current.position.z - tz, group.current.position.x - tx) > 0.2;
    bob.current += dt * (moving ? 9 : 1.8);
    const dead = status === "awaiting_revive";
    group.current.position.y = dead ? 0.2 : 0.9 + Math.sin(bob.current) * (moving ? 0.07 : 0.025);

    const next = nodes[Math.min(zoneIndex + 1, nodes.length - 1)];
    const lookX = (next?.position.x ?? node?.position.x ?? 0) * 0.12;
    const lookZ = next?.position.z ?? tz + 1;
    const yaw = Math.atan2(lookX - group.current.position.x, lookZ - group.current.position.z);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, yaw, 0.1);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, dead ? Math.PI / 2.2 : 0, 0.1);
  });

  const cloak = status === "awaiting_revive" ? "#6b2430" : status === "survived" ? "#1b7a52" : "#243044";
  const trim = "#e07a5f";

  return (
    <group ref={group} position={[0, 0.9, 0]}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.28, 0.5, 8, 16]} />
        <meshStandardMaterial color={cloak} roughness={0.5} metalness={0.12} />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color="#e6c3a5" roughness={0.6} metalness={0.04} />
      </mesh>
      <mesh castShadow position={[0, 1.1, -0.04]}>
        <torusGeometry args={[0.26, 0.07, 12, 24]} />
        <meshStandardMaterial color={trim} roughness={0.45} metalness={0.18} />
      </mesh>
      <mesh castShadow position={[0, 0.65, -0.3]}>
        <boxGeometry args={[0.3, 0.36, 0.18]} />
        <meshStandardMaterial color="#4a3426" roughness={0.85} />
      </mesh>
      {/* legs hint */}
      <mesh castShadow position={[-0.12, 0.15, 0]}>
        <capsuleGeometry args={[0.08, 0.25, 4, 8]} />
        <meshStandardMaterial color="#1c2433" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.12, 0.15, 0]}>
        <capsuleGeometry args={[0.08, 0.25, 4, 8]} />
        <meshStandardMaterial color="#1c2433" roughness={0.7} />
      </mesh>
      <EquippedGear inventory={inventory} />
    </group>
  );
}
