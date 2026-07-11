import type { RealtimeEvent } from "@driftlands/shared";
import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";

type Client = { ws: WebSocket; journeyId?: string; playerId?: string };

/**
 * Realtime fan-out. Prefers Ably when ABLY_API_KEY is set; otherwise
 * uses an in-process WebSocket hub so local/demo deploys need zero infra.
 */
export class RealtimeHub {
  private clients = new Set<Client>();
  private ably: { channels: { get: (name: string) => { publish: (name: string, data: unknown) => Promise<unknown> } } } | null = null;
  private wss: WebSocketServer | null = null;

  async init(server: Server): Promise<void> {
    const key = process.env.ABLY_API_KEY;
    if (key) {
      const Ably = (await import("ably")).default;
      const rest = new Ably.Rest(key);
      this.ably = rest as unknown as RealtimeHub["ably"];
    }

    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (ws) => {
      const client: Client = { ws };
      this.clients.add(client);
      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(String(raw)) as { type: string; journeyId?: string; playerId?: string };
          if (msg.type === "subscribe") {
            client.journeyId = msg.journeyId;
            client.playerId = msg.playerId;
          }
        } catch {
          /* ignore malformed */
        }
      });
      ws.on("close", () => this.clients.delete(client));
    });
  }

  async publish(journeyId: string, event: RealtimeEvent): Promise<void> {
    const payload = JSON.stringify({ journeyId, event });

    for (const client of this.clients) {
      if (client.journeyId === journeyId && client.ws.readyState === 1) {
        client.ws.send(payload);
      }
    }

    if (this.ably) {
      await this.ably.channels.get(`journey:${journeyId}`).publish(event.type, event);
    }
  }
}

export const realtime = new RealtimeHub();
