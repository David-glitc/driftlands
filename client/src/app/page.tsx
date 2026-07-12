"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { EquippedArtifact, JourneySeed, LevelStateView, OddsPoolView, PlayerSession, GameRoom } from "@driftlands/shared";
import { getArtifactById } from "@driftlands/shared";
import { api } from "@/lib/api";
import { loadDemoLevel } from "@/lib/demoStake";
import { loadSettings, type DriftSettings } from "@/lib/settings";
import { KNOWN_MINTS } from "@/lib/tokens";
import { Hud } from "@/components/Hud";
import { DeathModal } from "@/components/DeathModal";
import { OddsPoolPanel } from "@/components/OddsPoolPanel";
import { Landing } from "@/components/Landing";
import { ResultBanner } from "@/components/ResultBanner";
import { AppChrome } from "@/components/AppChrome";
import { SettingsPanel } from "@/components/SettingsPanel";
import { HotkeysManual } from "@/components/HotkeysManual";
import { FullProfilePage } from "@/components/FullProfilePage";
import { RoomPanel } from "@/components/RoomPanel";
import { TokenSidebar } from "@/components/TokenSidebar";
import { SwapModal } from "@/components/SwapModal";
import { Dashboard } from "@/components/Dashboard";
import { DialoguePanel } from "@/components/DialoguePanel";
import { useRealtime } from "@/lib/realtime";
import type { ResourceWallet, DialogueTree } from "@driftlands/shared";
import { EMPTY_WALLET, getScriptForNode } from "@driftlands/shared";
import {
  initAudio,
  playArtifact,
  playDeath,
  playHazard,
  playJourneyEnd,
  playJourneyStart,
  playRevive,
  startAmbient,
  stopAmbient,
} from "@/lib/audio";

const WorldCanvasEl = dynamic(() => import("@/components/WorldCanvas").then((m) => m.WorldCanvas), {
  ssr: false,
  loading: () => <div className="canvas-fallback">Entering the dunes…</div>,
});

type EndState = {
  survived: boolean;
  reputationDelta: number;
  resultHash: string;
};

export default function HomePage() {
  const [playerId, setPlayerId] = useState("Wanderer");
  const [journey, setJourney] = useState<JourneySeed | null>(null);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [pool, setPool] = useState<OddsPoolView | null>(null);
  const [reviveFee, setReviveFee] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [end, setEnd] = useState<EndState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestDropId, setLatestDropId] = useState<string | null>(null);
  const [lastItemBonus, setLastItemBonus] = useState<number | null>(null);
  const [level, setLevel] = useState<LevelStateView | null>(null);
  const [settings, setSettings] = useState<DriftSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomReady, setRoomReady] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapMint, setSwapMint] = useState(KNOWN_MINTS.SOL);
  const [swapDir, setSwapDir] = useState<"buy" | "sell">("buy");
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [wallet, setWallet] = useState<ResourceWallet>({ ...EMPTY_WALLET });
  const [dialogue, setDialogue] = useState<DialogueTree | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 6 });
  const [nearbyNodeIdx, setNearbyNodeIdx] = useState<number | null>(null);

  useRealtime(roomId ? `room:${roomId}` : "lobby");

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 6));
  }, []);

  const leaveJourney = useCallback(() => {
    stopAmbient();
    setJourney(null);
    setSession(null);
    setEnd(null);
    setPool(null);
    setInventoryOpen(false);
  }, []);

  const start = useCallback(async (difficulty: "easy" | "standard" | "hard") => {
    setBusy(true);
    setError(null);
    setEnd(null);
    setLog([]);
    try {
      const data = await api.startJourney({
        playerId,
        difficulty,
        levelScore: level?.levelScore && level.levelScore > 0 ? level.levelScore : 14,
      });
      setJourney(data.journey);
      setSession(data.session);
      setReviveFee(data.reviveFeePreview);
      setPool(null);
      setLatestDropId(null);
      setLastItemBonus(null);
      pushLog("You step onto the coral dunes.");
      if (settings.soundEnabled) {
        initAudio();
        startAmbient();
        playJourneyStart();
      }
      if (settings.showFpsHint) {
        pushLog("Tip: keep 30–40fps — drop Graphics in Settings if needed.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setBusy(false);
    }
  }, [level?.levelScore, playerId, pushLog, settings.showFpsHint]);

  const advance = useCallback(async () => {
    if (!journey || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.advance(journey.journeyId);
      setSession(data.session);
      if (data.pool) setPool(data.pool);
      setLastItemBonus(data.result.itemBonus ?? null);
      const node = journey.nodes.find((n) => n.nodeId === data.result.nodeId);
      pushLog(
        data.result.survived
          ? `Cleared ${node?.label ?? "node"} · ${Math.round(data.result.survivalChance * 100)}% odds`
          : `Down at ${node?.label ?? "node"}`,
      );
      if (data.result.droppedArtifact) {
        const def = getArtifactById(data.result.droppedArtifact.artifactId);
        setLatestDropId(data.result.droppedArtifact.artifactId);
        pushLog(`Found ${def?.displayName ?? "a fragment"}`);
        if (settings.soundEnabled) playArtifact();
      } else {
        setLatestDropId(null);
      }
      if (data.ended) {
        setEnd({
          survived: data.ended.survived,
          reputationDelta: data.ended.reputationDelta,
          resultHash: data.ended.resultHash,
        });
        if (settings.soundEnabled) {
          playJourneyEnd(data.ended.survived);
          stopAmbient();
        }
      }
      if (data.session.status === "awaiting_revive" && settings.soundEnabled) {
        playDeath();
      }
      if (data.result.survived && settings.soundEnabled) {
        playHazard(data.result.levelBonus ?? 0.3);
      }
      // Check for script events on this node
      const currentNode = journey.nodes.find((n) => n.nodeId === data.result.nodeId);
      if (currentNode) {
        const script = getScriptForNode(currentNode.kind, data.session.zoneIndex);
        if (script) setDialogue(script);
      }
      if (data.session.status === "awaiting_revive") {
        const fresh = await api.getJourney(journey.journeyId);
        setReviveFee(fresh.reviveFeePreview);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Advance failed");
    } finally {
      setBusy(false);
    }
  }, [busy, journey, pushLog]);

  const revive = async () => {
    if (!journey) return;
    setBusy(true);
    try {
      const data = await api.revive(journey.journeyId);
      setSession(data.session);
      setReviveFee(null);
      pushLog(`Revived · ${data.fee} $DRIFT`);
      if (settings.soundEnabled) playRevive();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revive failed");
    } finally {
      setBusy(false);
    }
  };

  const enterPool = async (outcomeId: string) => {
    if (!pool || !session) return;
    try {
      const data = await api.enterPool(pool.poolId, {
        playerId: session.playerId,
        outcomeId,
        amount: 0.5,
      });
      setPool(data.pool);
      pushLog(`Pool entry · ${outcomeId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pool entry failed");
    }
  };

  const joinRoom = (id: string) => {
    setRoomId(id);
    setRoomReady(false);
  };

  const handleRoomCreate = (room: GameRoom) => {
    setRoomId(room.roomId);
    setRoomReady(false);
  };

  const leaveRoom = () => {
    setRoomId(null);
    setRoomReady(false);
  };

  const startRoomJourney = (seed: JourneySeed) => {
    setJourney(seed);
    setRoomReady(true);
  };

  const handleInteract = useCallback(async () => {
    if (!journey || !session || busy) return;
    if (session.status !== "active" || end) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.advance(journey.journeyId);
      setSession(data.session);
      if (data.pool) setPool(data.pool);
      setLastItemBonus(data.result.itemBonus ?? null);
      const node = journey.nodes.find((n) => n.nodeId === data.result.nodeId);
      pushLog(data.result.survived
        ? `Cleared ${node?.label ?? "node"} · ${Math.round(data.result.survivalChance * 100)}%`
        : `Down at ${node?.label ?? "node"}`);
      if (data.result.droppedArtifact) {
        setLatestDropId(data.result.droppedArtifact.artifactId);
        pushLog(`Found ${getArtifactById(data.result.droppedArtifact.artifactId)?.displayName ?? "a fragment"}`);
        if (settings.soundEnabled) playArtifact();
      } else { setLatestDropId(null); }
      if (data.ended) {
        setEnd({ survived: data.ended.survived, reputationDelta: data.ended.reputationDelta, resultHash: data.ended.resultHash });
        if (settings.soundEnabled) { playJourneyEnd(data.ended.survived); stopAmbient(); }
      }
      if (data.session.status === "awaiting_revive" && settings.soundEnabled) playDeath();
      if (data.result.survived && settings.soundEnabled) playHazard(data.result.levelBonus ?? 0.3);
      const nearby = journey.nodes.find((_, i) => i === (nearbyNodeIdx ?? -1));
      if (nearby && data.result.survived) {
        const script = getScriptForNode(nearby.kind, data.session.zoneIndex);
        if (script) setDialogue(script);
      }
      if (data.session.status === "awaiting_revive") {
        const fresh = await api.getJourney(journey.journeyId);
        setReviveFee(fresh.reviveFeePreview);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Interact failed");
    } finally { setBusy(false); }
  }, [busy, journey, session, end, nearbyNodeIdx, pushLog, settings]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("dl_player") : null;
    if (stored) setPlayerId(stored);
    setLevel(loadDemoLevel(stored ?? "Wanderer"));
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("dl_player", playerId);
  }, [playerId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setProfileOpen(true);
        return;
      }
      if (e.key === "e" || e.key === "E") {
        if (session?.status === "active" && !end && !busy && nearbyNodeIdx !== null) {
          e.preventDefault();
          void handleInteract();
          return;
        }
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHotkeysOpen(true);
        return;
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (profileOpen) {
          setProfileOpen(false);
          return;
        }
        if (hotkeysOpen) {
          setHotkeysOpen(false);
          return;
        }
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (inventoryOpen) {
          setInventoryOpen(false);
          return;
        }
        setSettingsOpen(true);
        return;
      }

      const onLanding = !journey || !session;
      if (onLanding) {
        if (e.key === "1") void start("easy");
        if (e.key === "2") void start("standard");
        if (e.key === "3") void start("hard");
        return;
      }

      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setInventoryOpen((v) => !v);
        return;
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        leaveJourney();
        return;
      }
      if (
        (e.key === " " || e.key === "Enter") &&
        session.status === "active" &&
        !end &&
        !busy
      ) {
        e.preventDefault();
        void advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    advance,
    busy,
    end,
    profileOpen,
    hotkeysOpen,
    inventoryOpen,
    journey,
    leaveJourney,
    session,
    settingsOpen,
    start,
    handleInteract,
    nearbyNodeIdx,
    end,
    busy,
  ]);

  const dialogs = (
    <>
      <AppChrome
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHotkeys={() => setHotkeysOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettings={setSettings}
      />
      <HotkeysManual open={hotkeysOpen} onClose={() => setHotkeysOpen(false)} />
      <FullProfilePage
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        playerId={playerId}
      />
      <SwapModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        defaultMint={swapMint}
        defaultDirection={swapDir}
        walletAddress={undefined}
      />
      <Dashboard
        open={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        walletAddress={undefined}
        onSwap={(mint, dir) => {
          setDashboardOpen(false);
          setSwapMint(mint);
          setSwapDir(dir);
          setSwapOpen(true);
        }}
      />
    </>
  );

  const sidebar = (
    <TokenSidebar
      onSwap={(mint, dir) => {
        setSwapMint(mint);
        setSwapDir(dir);
        setSwapOpen(true);
      }}
    />
  );

  if (!journey || !session) {
    if (roomId && !roomReady) {
      return (
        <>
          {dialogs}
          {sidebar}
          <RoomPanel
            roomId={roomId}
            playerId={playerId}
            onStartJourney={startRoomJourney}
            onLeave={leaveRoom}
          />
        </>
      );
    }

    return (
      <>
        {dialogs}
        {sidebar}
        <Landing
          playerId={playerId}
          onPlayerId={setPlayerId}
          level={level}
          onLevel={setLevel}
          onStart={start}
          busy={busy}
          error={error}
          reducedMotion={settings.reducedMotion}
          graphicsQuality={settings.graphicsQuality}
          onJoinRoom={joinRoom}
          onCreateRoom={handleRoomCreate}
        />
      </>
    );
  }

  const inventory: EquippedArtifact[] = session.inventory;
  const currentNode = journey.nodes[session.zoneIndex];

  return (
    <main style={styles.shell}>
      {dialogs}
      {sidebar}
      <button type="button" style={styles.leave} onClick={leaveJourney}>
        Leave
      </button>

      <div style={styles.stage}>
        <WorldCanvasEl
          nodes={journey.nodes}
          zoneIndex={session.zoneIndex}
          status={session.status}
          inventory={inventory}
          latestDropId={latestDropId}
          graphicsQuality={settings.graphicsQuality}
          reducedMotion={settings.reducedMotion}
          cameraShake={settings.cameraShake}
          playerPosition={playerPos}
          onMove={setPlayerPos}
          nearbyNodeIdx={nearbyNodeIdx}
          onProximityChange={setNearbyNodeIdx}
        />
        <Hud
          session={session}
          currentNode={currentNode}
          totalNodes={journey.nodes.length}
          log={log}
          busy={busy}
          nearbyNodeIdx={nearbyNodeIdx}
          nearNode={journey.nodes[nearbyNodeIdx ?? -1] ?? undefined}
          onInteract={handleInteract}
          inventoryOpen={inventoryOpen}
          onInventoryOpenChange={setInventoryOpen}
          showHotkeyHints={settings.showHotkeyHints}
          wallet={wallet}
        />
        {pool && !pool.resolved && session.status === "active" && (
          <OddsPoolPanel pool={pool} onEnter={enterPool} />
        )}
      </div>

      {session.status === "awaiting_revive" && (
        <DeathModal
          fee={reviveFee}
          reviveCount={session.reviveCount}
          busy={busy}
          onRevive={revive}
          itemBonus={lastItemBonus}
        />
      )}
      {end && (
        <ResultBanner
          end={end}
          onAgain={() => {
            setJourney(null);
            setSession(null);
            setEnd(null);
          }}
        />
      )}
      {error && <p style={styles.error}>{error}</p>}

      {dialogue && (
        <DialoguePanel
          dialogue={dialogue}
          onChoice={(lineId, choiceIdx) => {
            if (choiceIdx < 0) return;
            try {
              const line = dialogue.lines[lineId];
              const choice = line?.choices?.[choiceIdx];
              if (choice?.effect) {
                const eff = choice.effect;
                if (eff.type === "grant_resource") {
                  const parts = String(eff.value ?? "0").split(":");
                  const resId = parts[0] ?? "drift_dust";
                  const amt = parseInt(parts[1] ?? "0", 10);
                  setWallet((w) => ({ ...w, [resId]: (w[resId as keyof ResourceWallet] ?? 0) + amt }));
                }
              }
            } catch { /* ignore */ }
          }}
          onClose={() => setDialogue(null)}
        />
      )}

      <style jsx global>{`
        .canvas-fallback {
          height: 100%;
          min-height: 100vh;
          display: grid;
          place-items: center;
          color: #fff;
          font-weight: 700;
          background: linear-gradient(180deg, #87c5e8, #e8c89a);
        }
        @media (max-width: 860px) {
          main section:first-of-type {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            padding-top: 88px !important;
          }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    position: "relative",
    background: "#0b1220",
  },
  leave: {
    position: "absolute",
    top: 16,
    left: 148,
    zIndex: 30,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(20,24,40,0.72)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 700,
  },
  stage: {
    position: "relative",
    minHeight: "100vh",
    height: "100vh",
    overflow: "hidden",
  },
  error: {
    position: "fixed",
    bottom: 16,
    left: 16,
    color: "#ff4d6d",
    fontWeight: 700,
    margin: 0,
    zIndex: 40,
  },
};
