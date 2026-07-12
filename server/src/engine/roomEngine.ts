import { nanoid } from "nanoid";
import {
  type GameRoom,
  type RoomPlayer,
  type JourneySeed,
  type RealtimeEvent,
} from "@driftlands/shared";
import { generateJourney } from "@driftlands/shared";
import { startJourney, resolveCurrentNode, reviveJourney } from "./journeyEngine.js";
import { realtime } from "../realtime.js";

const rooms = new Map<string, GameRoom>();

// Room stats logging every 60s
setInterval(() => {
  const active = rooms.size;
  const waiting = [...rooms.values()].filter((r) => r.status === "waiting").length;
  const inProgress = [...rooms.values()].filter((r) => r.status === "in_progress").length;
  const totalPlayers = [...rooms.values()].reduce((sum, r) => sum + r.players.length, 0);
  if (active > 0) {
    console.log(`[driftlands] rooms: ${active} (${waiting} waiting, ${inProgress} in-progress), players: ${totalPlayers}`);
  }
}, 60_000).unref();

export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId);
}

export function listRooms(): GameRoom[] {
  return [...rooms.values()].filter((r) => r.status === "waiting");
}

export function createRoom(params: {
  name: string;
  hostId: string;
  hostName: string;
  maxPlayers?: number;
  difficulty?: "easy" | "standard" | "hard";
}): GameRoom {
  const roomId = `room_${nanoid(8)}`;
  const room: GameRoom = {
    roomId,
    name: params.name,
    hostId: params.hostId,
    players: [
      {
        playerId: params.hostId,
        displayName: params.hostName,
        joinedAt: Date.now(),
        ready: false,
      },
    ],
    maxPlayers: params.maxPlayers ?? 4,
    difficulty: params.difficulty ?? "standard",
    status: "waiting",
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);

  realtime.publish(`room:${roomId}`, {
    type: "room.created",
    payload: room,
  });
  realtime.publish("lobby", {
    type: "lobby.players",
    payload: { count: rooms.size, players: [] },
  });

  return room;
}

export function joinRoom(roomId: string, playerId: string, displayName: string): GameRoom {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  if (room.status !== "waiting") throw new Error("Game already in progress");
  if (room.players.length >= room.maxPlayers) throw new Error("Room full");
  if (room.players.some((p) => p.playerId === playerId)) {
    return room;
  }

  const player: RoomPlayer = {
    playerId,
    displayName,
    joinedAt: Date.now(),
    ready: false,
  };
  room.players.push(player);

  realtime.publish(`room:${roomId}`, {
    type: "room.player_joined",
    payload: { roomId, player },
  });

  return room;
}

export function leaveRoom(roomId: string, playerId: string): GameRoom {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  room.players = room.players.filter((p) => p.playerId !== playerId);

  realtime.publish(`room:${roomId}`, {
    type: "room.player_left",
    payload: { roomId, playerId },
  });

  if (room.players.length === 0) {
    rooms.delete(roomId);
    return room;
  }

  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0]!.playerId;
  }

  return room;
}

export function setReady(roomId: string, playerId: string, ready: boolean): GameRoom {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  const player = room.players.find((p) => p.playerId === playerId);
  if (!player) throw new Error("Player not in room");
  player.ready = ready;

  realtime.publish(`room:${roomId}`, {
    type: "player.ready",
    payload: { playerId, ready },
  });

  return room;
}

export function startRoomJourney(roomId: string, playerId: string): { room: GameRoom; journeySeed: JourneySeed } {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== playerId) throw new Error("Only the host can start");
  if (room.status !== "waiting") throw new Error("Room already in progress");

  const allReady = room.players.every((p) => p.ready);
  if (!allReady) throw new Error("Not all players are ready");

  const journeySeed = generateJourney({
    journeyId: `${roomId}_journey`,
    seed: Math.floor(Math.random() * 2_147_483_647),
    difficulty: room.difficulty,
  });

  room.journeySeed = journeySeed;
  room.status = "in_progress";

  for (const p of room.players) {
    const active = startJourney({
      playerId: p.playerId,
      difficulty: room.difficulty,
      levelScore: 14,
      forceNew: true,
    });
    p.session = active.session;
  }

  realtime.publish(`room:${roomId}`, {
    type: "room.started",
    payload: { roomId, journeySeed },
  });

  return { room, journeySeed };
}

export function advanceRoomPlayer(roomId: string, playerId: string): {
  player: RoomPlayer;
  room: GameRoom;
  ended: boolean;
} {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");
  if (room.status !== "in_progress") throw new Error("Room not in progress");

  const player = room.players.find((p) => p.playerId === playerId);
  if (!player) throw new Error("Player not in room");
  if (!player.session) throw new Error("Player has no active session");

  const journeyId = player.session.journeyId;
  try {
    const resolved = resolveCurrentNode(journeyId);
    const { session, event } = resolved;
    const journeyEnded = resolved.ended;
    player.session = session;

    const enrichedEvent: RealtimeEvent = {
      ...event,
      payload: { ...(event.payload as Record<string, unknown>), playerId },
    } as RealtimeEvent;
    realtime.publish(`room:${roomId}`, enrichedEvent);

    realtime.publish(`room:${roomId}`, {
      type: "player.advance",
      payload: { playerId, zoneIndex: session.zoneIndex, status: session.status },
    });

    if (journeyEnded) {
      realtime.publish(`room:${roomId}`, {
        type: "journey.ended",
        payload: { ...journeyEnded, playerId },
      });

      const allDone = room.players.every(
        (p) => !p.session || ["survived", "permadeath", "abandoned"].includes(p.session.status),
      );
      if (allDone) {
        room.status = "finished";
        realtime.publish(`room:${roomId}`, {
          type: "room.ended",
          payload: { roomId },
        });
        return { player, room, ended: true };
      }
      return { player, room, ended: true };
    }

    return { player, room, ended: false };
  } catch (err) {
    throw err;
  }
}

export function reviveRoomPlayer(roomId: string, playerId: string): RoomPlayer {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  const player = room.players.find((p) => p.playerId === playerId);
  if (!player) throw new Error("Player not in room");
  if (!player.session) throw new Error("Player has no active session");

  const { session } = reviveJourney(player.session.journeyId, { demoPaid: true });
  player.session = session;

  realtime.publish(`room:${roomId}`, {
    type: "player.revived",
    payload: { playerId, reviveCount: session.reviveCount },
  });

  return player;
}
