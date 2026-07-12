"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Sky,
  Stars,
  Text,
} from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { EquippedArtifact, JourneyNode, JourneyStatus } from "@driftlands/shared";
import { CHARACTERS, DIALOGUES } from "@driftlands/shared";
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
  playerPosition: { x: number; z: number };
  onMove: (pos: { x: number; z: number }) => void;
  nearbyNodeIdx: number | null;
  onProximityChange: (nodeIdx: number | null) => void;
};

const INTERACT_DIST = 3.5;

const HAZARD: Record<string, { color: string; emissive: string }> = {
  cache: { color: "#f2c14e", emissive: "#ff9f1c" },
  storm: { color: "#8ecae6", emissive: "#219ebc" },
  ambush: { color: "#e76f51", emissive: "#9b2226" },
  fire: { color: "#f4a261", emissive: "#e76f51" },
  fork: { color: "#2a9d8f", emissive: "#1d6f66" },
  checkpoint: { color: "#52b788", emissive: "#2d6a4f" },
};

const NPC_COLORS: Record<string, string> = {
  archivist: "#5CDBF0",
  wren: "#4ade80",
  solara: "#ff6b4a",
  keeper: "#c084fc",
  echo: "#fbbf24",
  collector: "#ffd166",
};

function worldPos(node: JourneyNode): [number, number, number] {
  return [node.position.x * 0.12, 0.9, node.position.z];
}

function dist2d(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

/* ── Sand + terrain (kept from original) ── */

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

function noise2(x: number, z: number) {
  return Math.sin(x * 0.09) * Math.cos(z * 0.07) * 2.6 + Math.sin(x * 0.23 + 1.7) * Math.cos(z * 0.19) * 1.1 + Math.sin(x * 0.05 + z * 0.04) * 3.2;
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
      <meshStandardMaterial map={sandMap} color="#f0d5a8" roughness={0.95} metalness={0.02} envMapIntensity={0.4} />
    </mesh>
  );
}

function DistantMesas() {
  const mesas = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      x: (i % 2 === 0 ? 1 : -1) * (28 + (i % 4) * 4),
      z: 20 + i * 16,
      h: 4 + (i % 5) * 1.4,
      w: 3 + (i % 3),
    })), []);
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
        list.push({
          p: [n.position.x + (k % 2 === 0 ? 1 : -1) * (7 + (i % 3) * 1.6), 0.35, n.position.z + (k - 1.5) * 2.4],
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
          <meshStandardMaterial color={i % 3 === 0 ? "#b08968" : "#9c7a55"} roughness={0.96} metalness={0.03} />
        </mesh>
      ))}
    </group>
  );
}

/* ── World Objects: Hazards, NPCs, Caches ── */

function WorldNodeMarker({ node, isNearby, color }: { node: JourneyNode; isNearby: boolean; color: { color: string; emissive: string } }) {
  const [wx, wy, wz] = worldPos(node);
  return (
    <Float speed={isNearby ? 1.6 : 0.5} floatIntensity={isNearby ? 0.3 : 0.08} rotationIntensity={0.05}>
      <group position={[wx, isNearby ? 2.8 + wy : 2.0 + wy, wz]}>
        <mesh castShadow>
          <icosahedronGeometry args={[isNearby ? 0.9 : 0.5, 1]} />
          <meshPhysicalMaterial color={color.color} emissive={color.emissive} emissiveIntensity={isNearby ? 0.7 : 0.12} roughness={0.25} metalness={0.55} clearcoat={0.4} clearcoatRoughness={0.3} />
        </mesh>
        {isNearby && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
            <ringGeometry args={[1.2, 1.5, 48]} />
            <meshBasicMaterial color={color.emissive} transparent opacity={0.5} />
          </mesh>
        )}
      </group>
    </Float>
  );
}

function NPCMarker({ name, position, isNearby }: { name: string; position: [number, number, number]; isNearby: boolean }) {
  const char = Object.values(CHARACTERS).find((c) => c.name === name) ?? CHARACTERS.archivist!;
  const color = NPC_COLORS[char.id] ?? "#ffd166";
  return (
    <Float speed={0.4} floatIntensity={0.15} rotationIntensity={0}>
      <group position={[position[0], position[1] + 0.4, position[2]]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.2, 0.35, 8, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} emissive={color} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#e6c3a5" roughness={0.6} />
        </mesh>
        {isNearby && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
              <ringGeometry args={[0.5, 0.65, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>
            <Text position={[0, 0.9, 0]} fontSize={0.2} color="#fff" anchorX="center" anchorY="middle" outlineColor="#000" outlineWidth={0.03}>
              {name}
            </Text>
          </>
        )}
      </group>
    </Float>
  );
}

/* ── Player Wanderer (free movement) ── */

function Wanderer({ position, status, inventory, onPosition }: {
  position: { x: number; z: number };
  status: JourneyStatus;
  inventory: EquippedArtifact[];
  onPosition: (pos: { x: number; z: number }) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const bob = useRef(0);
  const vel = useRef({ x: 0, z: 0 });
  const keys = useRef(new Set<string>());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const k = keys.current;
    const spd = 8;
    let dx = 0, dz = 0;
    if (k.has("w") || k.has("arrowup")) dz += spd;
    if (k.has("s") || k.has("arrowdown")) dz -= spd;
    if (k.has("a") || k.has("arrowleft")) dx -= spd;
    if (k.has("d") || k.has("arrowright")) dx += spd;

    vel.current.x += (dx - vel.current.x) * Math.min(dt * 6, 1);
    vel.current.z += (dz - vel.current.z) * Math.min(dt * 6, 1);

    const px = position.x + vel.current.x * dt;
    const pz = position.z + vel.current.z * dt;
    const clampedX = Math.max(-40, Math.min(40, px));
    const clampedZ = Math.max(-5, Math.min(200, pz));
    onPosition({ x: clampedX, z: clampedZ });

    group.current.position.x = clampedX;
    group.current.position.z = clampedZ;

    const moving = Math.hypot(vel.current.x, vel.current.z) > 0.5;
    bob.current += dt * (moving ? 8 : 1.5);
    const dead = status === "awaiting_revive";
    group.current.position.y = dead ? 0.2 : 0.9 + Math.sin(bob.current) * (moving ? 0.08 : 0.02);

    if (moving) {
      const yaw = Math.atan2(vel.current.x, vel.current.z);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, yaw, 0.12);
    }
  });

  const cloak = status === "awaiting_revive" ? "#6b2430" : status === "survived" ? "#1b7a52" : "#243044";
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
      <mesh position={[0, 1.1, -0.04]}>
        <torusGeometry args={[0.26, 0.07, 12, 24]} />
        <meshStandardMaterial color="#e07a5f" roughness={0.45} metalness={0.18} />
      </mesh>
      <mesh castShadow position={[0, 0.65, -0.3]}>
        <boxGeometry args={[0.3, 0.36, 0.18]} />
        <meshStandardMaterial color="#4a3426" roughness={0.85} />
      </mesh>
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

/* ── Free Camera ── */

function FreeCamera({ target, status }: { target: { x: number; z: number }; status: JourneyStatus }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const dead = status === "awaiting_revive";
    const tx = target.x;
    const tz = target.z;
    const ease = 3;
    const camTarget = new THREE.Vector3(tx - 6, dead ? 6 : 8, tz + 5);
    camera.position.lerp(camTarget, 1 - Math.exp(-ease * dt));
    look.current.lerp(new THREE.Vector3(tx, 1.5, tz), 1 - Math.exp(-(ease + 1) * dt));
    camera.lookAt(look.current);
  });
  return null;
}

/* ── Main Export ── */

export function WorldCanvas({
  nodes, zoneIndex, status, inventory, latestDropId,
  graphicsQuality = "high", reducedMotion = false,
  playerPosition, onMove, nearbyNodeIdx, onProximityChange,
}: Props) {
  const dpr: [number, number] = graphicsQuality === "low" ? [1, 1] : graphicsQuality === "medium" ? [1, 1.5] : [1, 2];
  const starCount = graphicsQuality === "low" ? 400 : 1200;
  const shadowMap = graphicsQuality === "low" ? 1024 : 2048;
  const high = graphicsQuality !== "low";
  const vhigh = graphicsQuality === "high";

  // Find which NPCs should appear at these nodes
  const npcsAtNodes = useMemo(() => {
    const result: Array<{ nodeIdx: number; charId: string; pos: [number, number, number] }> = [];
    nodes.forEach((node, i) => {
      const dialogues = DIALOGUES.filter((d) => d.trigger === node.kind);
      if (dialogues.length > 0) {
        const d = dialogues[i % dialogues.length]!;
        const char = CHARACTERS[d.character];
        if (char) {
          const [wx, wy, wz] = worldPos(node);
          result.push({ nodeIdx: i, charId: d.character, pos: [wx + 1.5, wy, wz + 1.5] });
        }
      }
    });
    return result;
  }, [nodes]);

  return (
    <Canvas
      shadows={high}
      dpr={dpr}
      gl={{ antialias: vhigh, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 45, near: 0.1, far: 280, position: [6, 8, 12] }}
      style={{ width: "100%", height: "100%", minHeight: "100vh", background: "#9ec9e8" }}
    >
      <color attach="background" args={["#9ec9e8"]} />
      <fog attach="fog" args={["#c5dff0", 55, 180]} />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#d7efff", "#c4a574", 0.65]} />
      <directionalLight castShadow={high} position={[30, 40, 18]} intensity={2.6} color="#fff3d6"
        shadow-mapSize={[shadowMap, shadowMap]} shadow-camera-far={140}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50} shadow-bias={-0.00015} />
      <Sky sunPosition={[100, 40, 50]} turbidity={3.2} rayleigh={0.85} />
      <Stars radius={140} depth={50} count={starCount} factor={2} saturation={0.15} fade speed={reducedMotion ? 0 : 0.25} />
      {vhigh && <Environment preset="sunset" />}

      <DesertTerrain length={nodes.length} />
      <DistantMesas />
      <RockField nodes={nodes} />

      {/* Hazard markers */}
      {nodes.map((node, i) => {
        const h = HAZARD[node.kind] ?? HAZARD.cache!;
        return <WorldNodeMarker key={node.nodeId} node={node} isNearby={nearbyNodeIdx === i} color={h} />;
      })}

      {/* NPCs */}
      {npcsAtNodes.map((npc) => {
        const char = CHARACTERS[npc.charId];
        if (!char) return null;
        return <NPCMarker key={`npc-${npc.nodeIdx}-${npc.charId}`} name={char.name} position={npc.pos} isNearby={nearbyNodeIdx === npc.nodeIdx} />;
      })}

      <WorldArtifactProps nodes={nodes} inventory={inventory} zoneIndex={zoneIndex} />
      <ActiveLootBurst artifactId={latestDropId ?? null} zoneIndex={zoneIndex} nodes={nodes} />
      <Wanderer position={playerPosition} status={status} inventory={inventory} onPosition={onMove} />
      {high && <ContactShadows position={[0, 0.02, 0]} opacity={0.55} scale={90} blur={2.8} far={22} />}
      <FreeCamera target={playerPosition} status={status} />

      <ProximityChecker nodes={nodes} playerPosition={playerPosition} onProximityChange={onProximityChange} />
    </Canvas>
  );
}

function ProximityChecker({ nodes, playerPosition, onProximityChange }: {
  nodes: JourneyNode[];
  playerPosition: { x: number; z: number };
  onProximityChange: (idx: number | null) => void;
}) {
  const lastRef = useRef<number | null>(null);
  useFrame(() => {
    let closest: number | null = null;
    let minDist = Infinity;
    nodes.forEach((node, i) => {
      const [wx, , wz] = worldPos(node);
      const d = dist2d(playerPosition.x, playerPosition.z, wx, wz);
      if (d < INTERACT_DIST && d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    if (closest !== lastRef.current) {
      lastRef.current = closest;
      onProximityChange(closest);
    }
  });
  return null;
}
