import http from "node:http";
import express from "express";
import cors from "cors";
import compression from "compression";
import { api } from "./routes.js";
import { realtime } from "./realtime.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT ?? 4000);
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
  }),
);
app.use(compression());
app.use(express.json({ limit: "256kb" }));

/* ── Rate limiting (in-memory, per-IP) ── */
const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 60;
const ipHits = new Map<string, { count: number; reset: number }>();

app.use((req, _res, next) => {
  const ip = req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  let bucket = ipHits.get(ip);
  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + RATE_WINDOW_MS };
    ipHits.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > RATE_MAX) {
    _res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
});

/* ── Clean stale rate-limit buckets every 60s ── */
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of ipHits) {
    if (now > b.reset) ipHits.delete(ip);
  }
}, 60_000).unref();

app.use("/api", api);

app.get("/", (_req, res) => {
  res.json({
    name: "Driftlands Game Server",
    version: "0.1.0",
    docs: "/api/health",
  });
});

const server = http.createServer(app);

async function main() {
  await prisma.$connect();

  /* ── Enable SQLite WAL mode for concurrent reads (200 users) ── */
  if (process.env.DATABASE_URL?.startsWith("file:")) {
    try {
      await prisma.$executeRaw`PRAGMA journal_mode = WAL;`;
      await prisma.$executeRaw`PRAGMA busy_timeout = 5000;`;
      console.log("[driftlands] SQLite WAL mode enabled");
    } catch (err) {
      console.warn("[driftlands] WAL pragma failed (ok in non-sqlite):", err);
    }
  }

  await realtime.init(server);
  server.listen(port, () => {
    console.log(`[driftlands] server listening on :${port}`);
    console.log(`[driftlands] demo mode: ${process.env.DEMO_MODE === "true"}`);
    console.log(`[driftlands] ws path: /ws`);
  });
}

/* ── Graceful shutdown ── */
let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[driftlands] ${signal} received, shutting down…`);
  server.close(() => {
    console.log("[driftlands] HTTP server closed");
  });
  realtime.close();
  prisma
    .$disconnect()
    .then(() => {
      console.log("[driftlands] DB disconnected");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[driftlands] disconnect error:", err);
      process.exit(1);
    });
  setTimeout(() => {
    console.warn("[driftlands] forced exit after 10s");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
