"use client";

import { Component, type ReactNode } from "react";
import { DynamicProvider } from "./DynamicProvider";

class DynamicErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * Client-only Dynamic wrap with hard fallback so a wallet SDK failure
 * never blanks the Driftlands landing (lesson from Atomic boot crashes).
 */
export function ClientAuthShell({ children }: { children: ReactNode }) {
  return (
    <DynamicErrorBoundary fallback={children}>
      <DynamicProvider>{children}</DynamicProvider>
    </DynamicErrorBoundary>
  );
}
