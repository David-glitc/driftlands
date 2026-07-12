"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameRoom, JourneySeed } from "@driftlands/shared";
import { api } from "@/lib/api";

type Props = {
  roomId: string;
  playerId: string;
  onStartJourney: (seed: JourneySeed) => void;
  onLeave: () => void;
};

export function RoomPanel({ roomId, playerId, onStartJourney, onLeave }: Props) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = room?.hostId === playerId;
  const allReady = room?.players.every((p) => p.ready) && room.players.length >= 2;

  const fetchRoom = useCallback(() => {
    api.getRoom(roomId).then((d) => setRoom(d.room)).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const handleReady = async () => {
    setBusy(true);
    try {
      const data = await api.setReady(roomId, { playerId, ready: !ready });
      setReady(!ready);
      setRoom(data.room);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      const data = await api.startRoom(roomId, { playerId });
      setRoom(data.room);
      onStartJourney(data.journeySeed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    try {
      await api.leaveRoom(roomId, { playerId });
    } catch {
      /* already gone */
    }
    onLeave();
  };

  if (!room) {
    return (
      <div style={styles.wrap}>
        <p style={styles.loading}>Loading room...</p>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.name}>{room.name}</h2>
          <p style={styles.code}>Room code: <strong>{room.roomId}</strong> · Share to invite</p>
        </div>
        <button type="button" style={styles.leaveBtn} onClick={handleLeave}>Leave Room</button>
      </div>

      <div style={styles.players}>
        <h3 style={styles.playersTitle}>
          Wanderers ({room.players.length}/{room.maxPlayers})
        </h3>
        {room.players.map((p) => (
          <div key={p.playerId} style={styles.playerRow}>
            <span style={styles.playerName}>
              {p.displayName}
              {p.playerId === room.hostId && <span style={styles.hostBadge}>HOST</span>}
              {p.playerId === playerId && <span style={styles.youBadge}>YOU</span>}
            </span>
            <span style={{
              ...styles.readyDot,
              background: p.ready ? "#4ade80" : "#9a9a9a",
            }}>
              {p.ready ? "Ready" : "Not ready"}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          disabled={busy}
          style={{ ...styles.btn, background: ready ? "#9a9a9a" : "#4ade80" }}
          onClick={handleReady}
        >
          {ready ? "Unready" : "Ready Up"}
        </button>
        {isHost && (
          <button
            type="button"
            disabled={busy || !allReady}
            style={{ ...styles.btn, background: "#ffd166", color: "#0b1220", opacity: allReady ? 1 : 0.4 }}
            onClick={handleStart}
          >
            Start Drift
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <p style={styles.hint}>
        {isHost
          ? allReady
            ? "Everyone's ready — start the drift!"
            : "Waiting for all players to ready up..."
          : ready
            ? "Waiting for host to start..."
            : "Ready up when you're prepared!"}
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(11,18,32,0.92)",
    color: "#fff",
    padding: 24,
  },
  loading: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between" as const,
    width: "100%",
    maxWidth: 480,
    marginBottom: 20,
  },
  name: { margin: 0, fontSize: 24, fontWeight: 800, color: "#ffd166" },
  code: { margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  leaveBtn: {
    background: "rgba(255,255,255,0.1)",
    color: "#ef476f",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 999,
    padding: "8px 18px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
  },
  players: {
    width: "100%",
    maxWidth: 480,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  playersTitle: { margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" },
  playerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between" as const,
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  playerName: { fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 },
  hostBadge: {
    background: "#ffd166",
    color: "#0b1220",
    borderRadius: 6,
    padding: "1px 6px",
    fontSize: 9,
    fontWeight: 800,
  },
  youBadge: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    padding: "1px 6px",
    fontSize: 9,
    fontWeight: 800,
  },
  readyDot: {
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    color: "#0b1220",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
  },
  btn: {
    border: "none",
    borderRadius: 999,
    padding: "12px 32px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
    color: "#0b1220",
  },
  error: { color: "#ff4d6d", fontWeight: 600, fontSize: 12 },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8, textAlign: "center" as const },
};
