"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { HeaderSearchOverride } from "@/components/layout/Header";

type SetHeaderSearchOverride = (override: HeaderSearchOverride | undefined) => void;

// Split into two contexts on purpose: `usePublishHeaderSearch` must only ever subscribe to the
// setter (stable for the lifetime of the provider, per `useState`'s guarantee), never to the
// value itself. If a single context carried both, every publish would change the context value,
// re-render every consumer including the publisher, whose no-deps effect would publish again —
// an unconditional infinite render loop.
const HeaderSearchValueContext = createContext<HeaderSearchOverride | undefined>(undefined);
const HeaderSearchSetterContext = createContext<SetHeaderSearchOverride | undefined>(undefined);

export function HeaderSearchProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<HeaderSearchOverride | undefined>(undefined);

  return (
    <HeaderSearchSetterContext.Provider value={setOverride}>
      <HeaderSearchValueContext.Provider value={override}>{children}</HeaderSearchValueContext.Provider>
    </HeaderSearchSetterContext.Provider>
  );
}

/** Read hook for the chrome that renders `Header` (e.g. `AppChrome`). */
export function useHeaderSearchOverride(): HeaderSearchOverride | undefined {
  return useContext(HeaderSearchValueContext);
}

/**
 * Write hook for whichever page owns a live search experience (currently only `/catalog`).
 * Re-publishes on every render rather than chasing a stable dependency array — the override's
 * callbacks aren't referentially stable, and re-publishing is cheap next to the commerce engine's
 * own re-render cadence. Clears on unmount so navigating away reverts `Header` to its default mode.
 */
export function usePublishHeaderSearch(override: HeaderSearchOverride | undefined): void {
  const setOverride = useContext(HeaderSearchSetterContext);

  if (!setOverride) {
    throw new Error("usePublishHeaderSearch must be used within a HeaderSearchProvider");
  }

  useEffect(() => {
    setOverride(override);

    return () => setOverride(undefined);
  });
}
