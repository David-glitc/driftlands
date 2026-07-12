"use client";

import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import type { ReactNode } from "react";

/** Solana wallet connect via Dynamic (Phase 4). */
export const ATOMIC_DYNAMIC_ENVIRONMENT_ID = "d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6";

export function DynamicProvider({ children }: { children: ReactNode }) {
  const environmentId =
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || ATOMIC_DYNAMIC_ENVIRONMENT_ID;

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [SolanaWalletConnectors],
        events: {
          onAuthSuccess: () => {},
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}

export function WalletConnectButton() {
  return (
    <div className="dl-wallet">
      <DynamicWidget />
    </div>
  );
}
