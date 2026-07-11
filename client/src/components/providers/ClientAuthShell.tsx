"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Always paint children first (avoid blank shell).
 * Mount Dynamic only after client hydration — Atomic-style SSR guard.
 */
const DynamicProvider = dynamic(
  () => import("./DynamicProvider").then((m) => m.DynamicProvider),
  { ssr: false },
);

export function ClientAuthShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <DynamicProvider>{children}</DynamicProvider>;
}
