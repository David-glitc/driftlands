"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { RealtimeEvent } from "@driftlands/shared";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";

type EventHandler = (event: RealtimeEvent) => void;

export function useRealtime(channel: string | null, onEvent?: EventHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const handlersRef = useRef<EventHandler | undefined>(onEvent);
  handlersRef.current = onEvent;
  const channelRef = useRef(channel);
  channelRef.current = channel;
  const pingStartRef = useRef(0);

  // Exponential backoff state
  let reconnectAttempts = 0;

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let pingTimer: ReturnType<typeof setInterval>;

    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        setConnected(true);
        const ch = channelRef.current;
        if (ch) {
          ws.send(JSON.stringify({ type: "subscribe", channel: ch, playerId: localStorage.getItem("dl_player") ?? "Wanderer" }));
        }

        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingStartRef.current = Date.now();
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 10000);
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(String(msg.data));
          if (data.type === "pong") {
            setLatency(Date.now() - (pingStartRef.current ?? Date.now()));
            return;
          }
          if (data.type === "connected") return;

          const event = (data.event ?? data) as RealtimeEvent;
          handlersRef.current?.(event);
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        clearInterval(pingTimer);
        // Exponential backoff: 2s → 4s → 8s → 16s → max 30s
        const delay = Math.min(30_000, 2000 * Math.pow(2, reconnectAttempts));
        reconnectAttempts++;
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      clearInterval(pingTimer);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    const ch = channel;
    if (ch && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", channel: ch }));
    }
  }, [channel]);

  const publish = useCallback((event: RealtimeEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "publish", event }));
    }
  }, []);

  return { connected, latency, send, publish };
}
