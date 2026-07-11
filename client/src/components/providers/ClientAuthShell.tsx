"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

/**
 * Dynamic SDK must not SSR — mirrors Atomic’s client-only auth shell
 * to avoid “Store not initialized” on hydrate.
 */
const DynamicProvider = dynamic(
  () => import("./DynamicProvider").then((m) => m.DynamicProvider),
  { ssr: false },
);

export function ClientAuthShell({ children }: { children: ReactNode }) {
  return <DynamicProvider>{children}</DynamicProvider>;
}
