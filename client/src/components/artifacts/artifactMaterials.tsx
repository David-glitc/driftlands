"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ArtifactCategory, ArtifactRank } from "@driftlands/shared";

const texCache = new Map<string, THREE.CanvasTexture>();

function hashHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** Procedural albedo / roughness-style atlas keyed by artifact id + rank. */
export function getArtifactTexture(artifactId: string, rank: ArtifactRank, baseColor: string): THREE.CanvasTexture {
  const key = `${artifactId}:${rank}`;
  const hit = texCache.get(key);
  if (hit) return hit;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const hue = hashHue(artifactId);

  const grd = ctx.createLinearGradient(0, 0, size, size);
  grd.addColorStop(0, baseColor);
  grd.addColorStop(1, `hsl(${hue} 55% 42%)`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1200; i++) {
    const x = (i * 47) % size;
    const y = (i * 91) % size;
    const n = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.02 + n * 0.06})`;
    ctx.fillRect(x, y, 2 + (i % 3), 2);
  }

  // Edge wear
  ctx.strokeStyle = "rgba(27,31,59,0.35)";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  // Rank sheen
  if (rank === "rare" || rank === "epic" || rank === "legendary") {
    const rim = ctx.createRadialGradient(size * 0.3, size * 0.3, 10, size * 0.5, size * 0.5, size * 0.7);
    rim.addColorStop(0, "rgba(255,255,255,0.35)");
    rim.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, size, size);
  }
  if (rank === "legendary") {
    ctx.fillStyle = "rgba(255,224,138,0.25)";
    ctx.beginPath();
    ctx.arc(size * 0.7, size * 0.3, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function createArtifactMaterial(
  artifactId: string,
  rank: ArtifactRank,
  baseColor: string,
): THREE.MeshStandardMaterial {
  const matKey = `mat:${artifactId}:${rank}`;
  const cached = matCache.get(matKey);
  if (cached) return cached;

  const map = getArtifactTexture(artifactId, rank, baseColor);
  const metalness = rank === "legendary" ? 0.55 : rank === "epic" ? 0.4 : rank === "rare" ? 0.28 : 0.12;
  const roughness = rank === "legendary" ? 0.28 : rank === "common" ? 0.78 : 0.45;
  const mat = new THREE.MeshStandardMaterial({
    map,
    color: "#ffffff",
    metalness,
    roughness,
    emissive: new THREE.Color(baseColor),
    emissiveIntensity: rank === "legendary" ? 0.55 : rank === "epic" ? 0.32 : rank === "rare" ? 0.2 : 0.1,
  });
  matCache.set(matKey, mat);
  return mat;
}

export function ArtifactGeometry({ category }: { category: ArtifactCategory }) {
  const geo = useMemo(() => {
    switch (category) {
      case "armor":
        return new THREE.BoxGeometry(0.42, 0.5, 0.18);
      case "food":
        return new THREE.CylinderGeometry(0.12, 0.14, 0.32, 12);
      case "tool":
        return new THREE.ConeGeometry(0.12, 0.55, 8);
      case "charm":
      default:
        return new THREE.IcosahedronGeometry(0.2, 1);
    }
  }, [category]);
  return <primitive object={geo} attach="geometry" />;
}
