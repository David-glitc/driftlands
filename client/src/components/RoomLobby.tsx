"use client";

import { useState, useEffect } from "react";
import type { GameRoom } from "@driftlands/shared";
import { api } from "@/lib/api";

type Props = {
  playerId: string;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (room: GameRoom) => void;
};

export function RoomLobby({ playerId, onJoinRoom, onCreateRoom }: Props) {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [difficulty, setDifficulty] = useState("standard");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    api.listRooms().then((d) => setRooms(d.rooms)).catch(() => {});
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await api.createRoom({
        playerId,
        displayName: playerId,
        name: roomName || `${playerId}'s Drift`,
        maxPlayers,
        difficulty,
      });
      onCreateRoom(data.room);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (roomId: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.joinRoom(roomId, { playerId, displayName: playerId });
      onJoinRoom(roomId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={styles.wrap} aria-label="Multiplayer">
      <h2 style={styles.heading}>Drift Together</h2>
      <p style={styles.sub}>Create a room or join one. Share the path, pool odds, race to survive.</p>

      <div style={styles.actions}>
        <button type="button" style={styles.createBtn} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Room"}
        </button>
        <div style={styles.joinRow}>
          <input
            placeholder="Room code..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            style={styles.joinInput}
            maxLength={16}
          />
          <button
            type="button"
            style={styles.joinBtn}
            disabled={!joinCode.trim()}
            onClick={() => handleJoin(joinCode.trim())}
          >
            Join
          </button>
        </div>
      </div>

      {showCreate && (
        <div style={styles.createForm}>
          <input
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={styles.input}
            maxLength={48}
          />
          <div style={styles.formRow}>
            <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} style={styles.select}>
              <option value={2}>2 players</option>
              <option value={3}>3 players</option>
              <option value={4}>4 players</option>
              <option value={6}>6 players</option>
              <option value={8}>8 players</option>
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={styles.select}>
              <option value="easy">Easy</option>
              <option value="standard">Standard</option>
              <option value="hard">Hard</option>
            </select>
            <button type="button" disabled={busy} style={styles.goBtn} onClick={handleCreate}>
              Go
            </button>
          </div>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {rooms.length > 0 && (
        <div style={styles.roomList}>
          <h3 style={styles.listTitle}>Open Rooms</h3>
          {rooms.map((room) => (
            <div key={room.roomId} style={styles.roomCard}>
              <div style={styles.roomInfo}>
                <strong>{room.name}</strong>
                <span style={styles.roomMeta}>
                  {room.players.length}/{room.maxPlayers} · {room.difficulty} · Host: {room.players[0]?.displayName.slice(0, 10)}
                </span>
              </div>
              <button type="button" style={styles.roomJoinBtn} onClick={() => handleJoin(room.roomId)}>
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    zIndex: 1,
    maxWidth: 640,
    margin: "64px auto 0",
    padding: "20px 24px",
    background: "rgba(20,24,40,0.75)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    color: "#fff",
  },
  heading: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#ffd166",
  },
  sub: {
    margin: "4px 0 14px",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
    alignItems: "center",
  },
  createBtn: {
    background: "#ffd166",
    color: "#0b1220",
    border: "none",
    borderRadius: 999,
    padding: "10px 20px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 13,
  },
  joinRow: { display: "flex", gap: 6, flex: 1 },
  joinInput: {
    flex: 1,
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 999,
    padding: "10px 16px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 13,
  },
  joinBtn: {
    background: "#4ade80",
    color: "#0b1220",
    border: "none",
    borderRadius: 999,
    padding: "10px 18px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 13,
  },
  createForm: {
    marginTop: 14,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    padding: 14,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 14,
  },
  input: {
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 14,
  },
  select: {
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 13,
    fontFamily: "inherit",
  },
  formRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  goBtn: {
    background: "#4ade80",
    color: "#0b1220",
    border: "none",
    borderRadius: 12,
    padding: "10px 24px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
  },
  error: { color: "#ff4d6d", fontWeight: 600, fontSize: 12, marginTop: 8 },
  roomList: { marginTop: 18 },
  listTitle: { fontSize: 14, fontWeight: 800, marginBottom: 8, color: "rgba(255,255,255,0.7)" },
  roomCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 6,
  },
  roomInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    fontWeight: 700,
    fontSize: 13,
  },
  roomMeta: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  roomJoinBtn: {
    background: "#4ade80",
    color: "#0b1220",
    border: "none",
    borderRadius: 999,
    padding: "6px 18px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
  },
};
