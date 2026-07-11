import http from "node:http";
import express from "express";
import cors from "cors";
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
app.use(express.json());
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
  await realtime.init(server);
  server.listen(port, () => {
    console.log(`[driftlands] server listening on :${port}`);
    console.log(`[driftlands] demo mode: ${process.env.DEMO_MODE === "true"}`);
    console.log(`[driftlands] ws path: /ws`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
