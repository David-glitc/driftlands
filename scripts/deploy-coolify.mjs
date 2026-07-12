#!/usr/bin/env node
/**
 * Deploy Driftlands to Coolify.
 *
 * Token sources (first match):
 *   1. COOLIFY_TOKEN env
 *   2. ~/.config/driftlands/coolify.env
 *   3. ./scripts/.coolify.env (local, gitignored)
 *
 * Usage:
 *   node scripts/deploy-coolify.mjs              # create/update compose service + start
 *   node scripts/deploy-coolify.mjs --list       # list applications + services
 *   node scripts/deploy-coolify.mjs --dns-only   # print DNS records to add
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createHash } from "node:crypto";
import { homedir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const COOLIFY_URL = (process.env.COOLIFY_URL ?? "https://coolify.chessonchain.online").replace(/\/$/, "");
/** Personal project used by hitmeup on the same Coolify instance */
const PROJECT_UUID = process.env.COOLIFY_PERSONAL_PROJECT_UUID ?? "qak4ll4915b0ri9gj8a57ztu";
const SERVER_UUID = process.env.COOLIFY_SERVER_UUID ?? "goyjivzepwvgk2egci5nms3i";
const SERVICE_NAME = process.env.DRIFTLANDS_COOLIFY_NAME ?? "driftlands";
const PUBLIC_WEB = process.env.DRIFTLANDS_PUBLIC_URL ?? "https://driftlands.kierkegaard.space";
/** Single-level subdomain — Cloudflare free Universal SSL does not cover api.driftlands.* */
const PUBLIC_API = process.env.DRIFTLANDS_API_URL ?? "https://driftlands-api.kierkegaard.space";
const VPS_IP = process.env.CLOUDFLARE_DEFAULT_IP ?? "109.205.181.119";
const SERVICE_UUID = process.env.DRIFTLANDS_SERVICE_UUID ?? "pjs273bfq41mp9zcq2e714ki";

function loadToken() {
  if (process.env.COOLIFY_TOKEN?.trim()) return process.env.COOLIFY_TOKEN.trim();
  const candidates = [
    join(homedir(), ".config/driftlands/coolify.env"),
    join(root, "scripts/.coolify.env"),
    join(root, ".env.local"),
  ];
  for (const f of candidates) {
    if (!existsSync(f)) continue;
    const text = readFileSync(f, "utf8");
    const m = text.match(/^COOLIFY_TOKEN=(.*)$/m) || text.match(/^(\d+\|[^\s]+)/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error(
    "COOLIFY_TOKEN missing. Put it in ~/.config/driftlands/coolify.env or export COOLIFY_TOKEN=...",
  );
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

function encodeCompose() {
  const coolifyCompose = join(root, "docker-compose.coolify.yml");
  let raw = existsSync(coolifyCompose)
    ? readFileSync(coolifyCompose, "utf8")
    : readFileSync(join(root, "docker-compose.yml"), "utf8");
  const signing = process.env.JOURNEY_SIGNING_SECRET ?? randomBytes(32).toString("hex");
  const replacements = {
    "https://driftlands.kierkegaard.space": PUBLIC_WEB,
    "https://driftlands-api.kierkegaard.space": PUBLIC_API,
    "change-me-in-coolify": signing,
    "${CORS_ORIGIN}": PUBLIC_WEB,
    "${CORS_ORIGIN:-}": PUBLIC_WEB,
    "${NEXT_PUBLIC_API_URL}": PUBLIC_API,
    "${NEXT_PUBLIC_WS_URL}": PUBLIC_API.replace(/^https/, "wss") + "/ws",
    "${NEXT_PUBLIC_DEMO_MODE:-true}": "true",
    "${NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID:-d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6}":
      "d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6",
    "${JOURNEY_SIGNING_SECRET:-change-me-in-coolify}": signing,
    "${DEMO_MODE:-true}": "true",
    "${ABLY_API_KEY:-}": process.env.ABLY_API_KEY ?? "",
    "${REDIS_URL:-}": process.env.REDIS_URL ?? "",
  };
  for (const [k, v] of Object.entries(replacements)) {
    raw = raw.split(k).join(v);
  }
  console.log("JOURNEY_SIGNING_SECRET fingerprint:", createHash("sha256").update(signing).digest("hex").slice(0, 12));
  return Buffer.from(raw, "utf8").toString("base64");
}

async function listAll() {
  const [apps, services, projects, servers] = await Promise.all([
    coolify("/applications"),
    coolify("/services"),
    coolify("/projects"),
    coolify("/servers"),
  ]);
  console.log("\nServers:");
  for (const s of servers ?? []) console.log(`  ${s.uuid}  ${s.name}  ${s.ip ?? ""}`);
  console.log("\nProjects:");
  for (const p of projects ?? []) console.log(`  ${p.uuid}  ${p.name}`);
  console.log("\nApplications:");
  for (const a of apps ?? []) {
    console.log(`  ${a.uuid}  ${a.name}  ${a.build_pack ?? ""}  ${a.status ?? ""}  ${a.fqdn ?? ""}`);
  }
  console.log("\nServices:");
  for (const s of services ?? []) console.log(`  ${s.uuid}  ${s.name}  ${s.status ?? ""}`);
}

function printDns() {
  console.log(`
Add Cloudflare DNS (zone kierkegaard.space) → ${VPS_IP} (proxied):
  A   driftlands       ${VPS_IP}
  A   driftlands-api   ${VPS_IP}
  # avoid api.driftlands — multi-level subdomain breaks Cloudflare free Universal SSL
`);
}

async function deploy() {
  const list = await coolify("/services");
  const existing = (list ?? []).find(
    (s) =>
      s.uuid === SERVICE_UUID ||
      s.name === SERVICE_NAME ||
      String(s.name ?? "").includes("driftlands"),
  );

  if (existing) {
    console.log(`Service exists: ${existing.uuid} — patching compose + restart`);
    await coolify(`/services/${existing.uuid}`, {
      method: "PATCH",
      body: JSON.stringify({
        docker_compose_raw: encodeCompose(),
        urls: [
          { name: "client", url: PUBLIC_WEB },
          { name: "server", url: PUBLIC_API },
        ],
      }),
    });
    await coolify(`/services/${existing.uuid}/restart`, { method: "POST", body: "{}" }).catch(() =>
      coolify(`/services/${existing.uuid}/start`, { method: "POST", body: "{}" }),
    );
    return existing.uuid;
  }

  const body = {
    name: SERVICE_NAME,
    description: "Driftlands web + game server (compose)",
    project_uuid: PROJECT_UUID,
    server_uuid: SERVER_UUID,
    environment_name: "production",
    destination_uuid: "0",
    instant_deploy: true,
    docker_compose_raw: encodeCompose(),
    urls: [
      { name: "client", url: PUBLIC_WEB },
      { name: "server", url: PUBLIC_API },
    ],
  };

  const created = await coolify("/services", { method: "POST", body: JSON.stringify(body) });
  const uuid = created?.uuid ?? created?.service_uuid ?? created?.id;
  console.log("Created service:", uuid);
  return uuid;
}

const args = process.argv.slice(2);
if (args.includes("--dns-only")) {
  printDns();
  process.exit(0);
}
if (args.includes("--list")) {
  await listAll();
  process.exit(0);
}

printDns();
const uuid = await deploy();
console.log(`
Driftlands Coolify service: ${uuid}
Web: ${PUBLIC_WEB}
API: ${PUBLIC_API}

In Coolify UI: attach domains to client:3000 and server:4000 if not auto-bound.
Dynamic dashboard: allow origin ${PUBLIC_WEB}
`);
