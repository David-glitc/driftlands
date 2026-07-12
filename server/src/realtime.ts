import type { RealtimeEvent } from "@driftlands/shared";
import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";

type Client = { ws: WebSocket; channel?: string; playerId?: string };

export class RealtimeHub {
  private clients = new Set<Client>();
  private ably: {
    channels: {
      get: (name: string) => {
        publish: (name: string, data: unknown) => Promise<unknown>;
      };
    };
  } | null = null;
  private wss: WebSocketServer | null = null;

  async init(server: Server): Promise<void> {
    const key = process.env.ABLY_API_KEY;
    if (key) {
      try {
        const Ably = (await import("ably")).default;
        const rest = new Ably.Rest(key);
        this.ably = rest as unknown as RealtimeHub["ably"];
        console.log("[driftlands] Ably REST client connected");
      } catch {
        console.warn("[driftlands] Ably init failed — falling back to local WS");
      }
    }

    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (ws) => {
      const client: Client = { ws };
      this.clients.add(client);

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(String(raw)) as {
            type: string;
            channel?: string;
            playerId?: string;
          };
          if (msg.type === "subscribe" && msg.channel) {
            client.channel = msg.channel;
            client.playerId = msg.playerId;
          }
          if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch {
          /* ignore */
        }
      });

      ws.on("close", () => {
        if (client.channel === "lobby") {
          this.publish("lobby", {
            type: "lobby.players",
            payload: { count: this.clients.size, players: [] },
          });
        }
        this.clients.delete(client);
      });

      ws.send(JSON.stringify({ type: "connected" }));
    });

    // Lobby heartbeat
    setInterval(() => {
      this.publish("lobby", {
        type: "lobby.players",
        payload: {
          count: this.clients.size,
          players: [...this.clients].map((c) => ({
            playerId: c.playerId ?? "unknown",
            displayName: c.playerId ?? "Wanderer",
          })),
        },
      });
    }, 15000);
  }

  async publish(channel: string, event: RealtimeEvent): Promise<void> {
    const payload = JSON.stringify({ channel, event });

    for (const client of this.clients) {
      if (client.channel === channel && client.ws.readyState === 1) {
        client.ws.send(payload);
      }
    }

    // Broadcast to all lobby clients when it's a lobby event
    if (channel === "lobby") {
      for (const client of this.clients) {
        if (client.channel === "lobby" || !client.channel) {
          client.ws.send(payload);
        }
      }
    }

    if (this.ably) {
      try {
        await this.ably.channels.get(channel).publish(event.type, event);
      } catch {
        /* Ably publish failed — WS still works */
      }
    }
  }

  close(): void {
    for (const client of this.clients) {
      try {
        client.ws.close(1001, "server shutting down");
      } catch {
        /* ignore */
      }
    }
    this.clients.clear();
    this.wss?.close();
    console.log("[driftlands] realtime hub closed");
  }
}

export const realtime = new RealtimeHub();
