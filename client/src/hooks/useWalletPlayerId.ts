"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";

/** Prefer connected Solana wallet pubkey as journey player id. */
export function useWalletPlayerId(fallback: string): {
  playerId: string;
  connected: boolean;
  truncated: string | null;
} {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address ?? null;
  const playerId = address ?? fallback;

  return {
    playerId,
    connected: Boolean(address),
    truncated: address ? `${address.slice(0, 4)}…${address.slice(-4)}` : null,
  };
}

export function SyncWalletPlayerId({
  onPlayerId,
}: {
  onPlayerId: (id: string) => void;
}) {
  const { primaryWallet } = useDynamicContext();
  useEffect(() => {
    if (primaryWallet?.address) onPlayerId(primaryWallet.address);
  }, [primaryWallet?.address, onPlayerId]);
  return null;
}
