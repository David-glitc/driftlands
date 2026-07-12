#!/usr/bin/env node
/**
 * Rebind Driftlands Coolify domains to same-host paths (Cloudflare free SSL
 * does not cover api.driftlands.* multi-level subdomains).
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COOLIFY_URL = "https://coolify.chessonchain.online";
const SERVICE_UUID = process.env.DRIFTLANDS_SERVICE_UUID ?? "pjs273bfq41mp9zcq2e714ki";
const WEB = "https://driftlands.kierkegaard.space";

function loadToken() {
  if (process.env.COOLIFY_TOKEN?.trim()) return process.env.COOLIFY_TOKEN.trim();
  for (const f of [
    join(homedir(), ".config/driftlands/coolify.env"),
    "/home/david/.config/driftlands/coolify.env",
  ]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(/^COOLIFY_TOKEN=(.*)$/m);
    if (m) return m[1].trim();
  }
  throw new Error("COOLIFY_TOKEN missing");
}

async function coolify(path, opts = {}) {
  const res = await fetch(`${COOLIFY_URL}/api/v1${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${loadToken()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

const secret = process.env.JOURNEY_SIGNING_SECRET ?? randomBytes(32).toString("hex");
console.log("JOURNEY_SIGNING_SECRET fingerprint", createHash("sha256").update(secret).digest("hex").slice(0, 12));

const compose = `services:
  server:
    image: driftlands-server:latest
    restart: unless-stopped
    environment:
      PORT: "4000"
      DEMO_MODE: "true"
      DATABASE_URL: file:/data/driftlands.db
      CORS_ORIGIN: ${WEB}
      JOURNEY_SIGNING_SECRET: ${secret}
      ABLY_API_KEY: ""
      REDIS_URL: ""
    volumes:
      - driftlands-data:/data
    expose:
      - "4000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:4000/api/health"]
      interval: 20s
      timeout: 5s
      retries: 5
      start_period: 40s

  client:
    image: driftlands-client:latest
    restart: unless-stopped
    depends_on:
      server:
        condition: service_healthy
    expose:
      - "3000"
    environment:
      PORT: "3000"
      HOSTNAME: 0.0.0.0

volumes:
  driftlands-data:
`;

await coolify(`/services/${SERVICE_UUID}`, {
  method: "PATCH",
  body: JSON.stringify({
    docker_compose_raw: Buffer.from(compose, "utf8").toString("base64"),
    // Path-based routes avoid api.driftlands multi-level SSL gap.
    urls: [
      { name: "client", url: WEB },
      { name: "server", url: `${WEB}/api,${WEB}/ws` },
    ],
  }),
});

await coolify(`/services/${SERVICE_UUID}/restart`, { method: "POST", body: "{}" });
console.log("Rebound domains + restarted", SERVICE_UUID);
console.log("Web:", WEB);
console.log("API path:", `${WEB}/api/health`);
