"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { PageContext, PageContextKind } from "@/features/conversation/models/conversation-models";

type PageContextSetter = (context: PageContext | undefined) => void;

// Split into two contexts on purpose: `setValue` from useState is a stable reference across
// renders, so a publisher's effect can safely depend on it. A single context object that bundles
// `{ value, setValue }` would be recreated every time `value` changes (to stay in sync with it),
// which would re-fire every publisher's effect, which calls `setValue` again — an infinite loop.
const PageContextValueContext = createContext<PageContext | undefined>(undefined);
const PageContextSetterContext = createContext<PageContextSetter>(() => {});

function deriveDefaultKind(pathname: string): PageContextKind {
  if (pathname.startsWith("/catalog")) {
    return "catalog";
  }
  if (pathname.startsWith("/products/")) {
    return "product";
  }
  if (pathname.startsWith("/blog/")) {
    return "article";
  }
  if (pathname.startsWith("/blog")) {
    return "blog";
  }
  return "home";
}

/**
 * Wraps the page tree and the globally-mounted conversational agent under one provider so a page
 * (PDP, blog article) can publish richer `PageContext` that the agent — mounted as a sibling in
 * layout.tsx, not a parent of `children` — can still read.
 */
export function AgentContextProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<PageContext | undefined>(undefined);

  return (
    <PageContextSetterContext.Provider value={setValue}>
      <PageContextValueContext.Provider value={value}>{children}</PageContextValueContext.Provider>
    </PageContextSetterContext.Provider>
  );
}

/** Reads the currently published `PageContext`, falling back to a pathname-derived default. */
export function usePageContext(): PageContext {
  const pathname = usePathname() ?? "/";
  const value = useContext(PageContextValueContext);
  return value ?? { kind: deriveDefaultKind(pathname), path: pathname };
}

/** Lets a page publish richer `PageContext` (title, id, query) while mounted. */
export function usePublishPageContext(context: Omit<PageContext, "path"> | undefined) {
  const pathname = usePathname() ?? "/";
  const setValue = useContext(PageContextSetterContext);
  const kind = context?.kind;
  const title = context?.title;
  const id = context?.id;
  const query = context?.query;

  useEffect(() => {
    if (!kind) {
      return;
    }

    setValue({ id, kind, path: pathname, query, title });
    return () => setValue(undefined);
  }, [id, kind, pathname, query, setValue, title]);
}
