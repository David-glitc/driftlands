"use client";

import { WalletConnectButton } from "@/components/providers/DynamicProvider";
import { SyncWalletPlayerId, useWalletPlayerId } from "@/hooks/useWalletPlayerId";

type Props = {
  playerId: string;
  onPlayerId: (id: string) => void;
};

/** Isolated so Landing can load it with next/dynamic ssr:false. */
export function WalletBar({ playerId, onPlayerId }: Props) {
  const { connected, truncated } = useWalletPlayerId(playerId);

  return (
    <>
      <SyncWalletPlayerId onPlayerId={onPlayerId} />
      <div style={styles.topBar}>
        <WalletConnectButton />
      </div>
      <div style={styles.walletStatus}>
        {connected ? (
          <span>
            Playing as <strong>{truncated}</strong>
          </span>
        ) : (
          <span>Connect a Solana wallet (Atomic Dynamic env) or play as guest.</span>
        )}
      </div>
      {!connected && null}
      <span data-connected={connected ? "1" : "0"} hidden />
    </>
  );
}

export function GuestIdField({
  playerId,
  onPlayerId,
  connected,
}: {
  playerId: string;
  onPlayerId: (id: string) => void;
  connected: boolean;
}) {
  if (connected) return null;
  return (
    <label style={styles.label}>
      Guest wanderer ID
      <input
        value={playerId}
        onChange={(e) => onPlayerId(e.target.value)}
        style={styles.input}
        maxLength={48}
      />
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 5,
  },
  walletStatus: {
    marginBottom: 16,
    fontWeight: 600,
    color: "#1b1f3b",
    background: "rgba(255,255,255,0.45)",
    border: "2px solid #1b1f3b",
    borderRadius: 12,
    padding: "10px 12px",
    maxWidth: 520,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 700,
    marginBottom: 18,
  },
  input: {
    border: "3px solid #1b1f3b",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 16,
    fontFamily: "inherit",
    background: "#fff1d6",
  },
};
