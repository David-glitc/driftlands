"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, Stars, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

function FloatingIsland() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
      groupRef.current.position.y = Math.sin(Date.now() * 0.0004) * 0.3;
    }
  });

  const blocks = useMemo(() => {
    const b: { pos: [number, number, number]; color: string; scale: [number, number, number] }[] = [];
    const grass = "#6b8e4e";
    const dirt = "#8b6914";
    const stone = "#707070";
    const gold = "#ffd166";

    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist > 5.5) continue;
        const edge = dist > 4.2;
        b.push({ pos: [x * 1.05, -2.4, z * 1.05], color: edge ? dirt : stone, scale: [1, 1, 1] });
        if (dist < 4.2) {
          b.push({ pos: [x * 1.05, -1.35, z * 1.05], color: dirt, scale: [1, 1, 1] });
        }
        if (dist < 3.8) {
          b.push({ pos: [x * 1.05, -0.3, z * 1.05], color: grass, scale: [1, 1, 1] });
        }
      }
    }

    // Central pedestal
    b.push({ pos: [0, 0.75, 0], color: gold, scale: [1.2, 0.4, 1.2] });
    b.push({ pos: [0, 1.2, 0], color: gold, scale: [0.8, 0.3, 0.8] });
    b.push({ pos: [0, 1.6, 0], color: "#ffaa00", scale: [0.4, 0.3, 0.4] });

    return b;
  }, []);

  return (
    <group ref={groupRef}>
      {blocks.map((block, i) => (
        <Block key={i} position={block.pos} color={block.color} scale={block.scale} />
      ))}
    </group>
  );
}

function Block({ position, color, scale }: { position: [number, number, number]; color: string; scale: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function FloatingPillar({ position, color }: { position: [number, number, number]; color: string; label?: string }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.y += Math.sin(Date.now() * 0.002 + position[0]) * 0.004;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Pillar */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 2.2, 6]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Top glow orb */}
      <mesh position={[0, 2.0, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      {/* Ring */}
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.06, 8, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

function FloatingRocks() {
  const rocks = useMemo(() => {
    const r: { pos: [number, number, number]; rot: [number, number, number]; scale: number; color: string }[] = [];
    const colors = ["#8b6914", "#707070", "#6b8e4e", "#9a8a6a"];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 8 + Math.random() * 6;
      r.push({
        pos: [Math.cos(angle) * dist, -1 + Math.random() * 4, Math.sin(angle) * dist],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: 0.3 + Math.random() * 0.7,
        color: colors[i % colors.length]!,
      });
    }
    return r;
  }, []);

  return (
    <>
      {rocks.map((rock, i) => (
        <Float key={i} speed={0.5 + Math.random() * 1} rotationIntensity={0.3} floatIntensity={0.4}>
          <mesh position={rock.pos} rotation={rock.rot} scale={rock.scale} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={rock.color} roughness={0.8} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Particles() {
  const count = 60;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 20;
      p[i * 3 + 1] = Math.random() * 12;
      p[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return p;
  }, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0003;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#ffd166" transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

function LobbyCamera() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.06;
  });
  return <group ref={ref} />;
}

type LobbyProps = {
  graphicsQuality?: "low" | "medium" | "high";
  reducedMotion?: boolean;
};

export function LobbyScene({ graphicsQuality = "high", reducedMotion = false }: LobbyProps) {
  const high = graphicsQuality === "high";
  const med = graphicsQuality !== "low";

  return (
    <Canvas
      camera={{ position: [7, 4, 9], fov: 50 }}
      dpr={high ? [1, 2] : 1}
      shadows={med}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2, antialias: high }}
    >
      <LobbyCamera />
      <color attach="background" args={["#1a1a4e"]} />
      <fog attach="fog" args={["#1a1a4e", 12, 35]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow shadow-mapSize={med ? [512, 512] : [256, 256]} />
      <hemisphereLight args={["#ffd166", "#1a1a4e", 0.3]} />

      <Sky sunPosition={[100, 30, 100]} turbidity={8} rayleigh={0.5} />
      {med && <Stars radius={30} depth={50} count={high ? 800 : 300} factor={3} fade speed={reducedMotion ? 0 : 0.5} />}
      {high && <Environment preset="sunset" />}

      <FloatingIsland />
      <FloatingRocks />

      <FloatingPillar position={[-3.5, 0, 2]} color="#4ade80" label="easy" />
      <FloatingPillar position={[0, 0, -3.5]} color="#fbbf24" label="standard" />
      <FloatingPillar position={[3.5, 0, 2]} color="#ef476f" label="hard" />

      {high && <Particles />}
    </Canvas>
  );
}
