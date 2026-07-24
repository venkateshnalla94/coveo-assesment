"use client";

import { Bell, ExternalLink, HelpCircle, LayoutGrid, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SearchBox } from "@/components/search/SearchBox";
import { SEARCH_UI } from "@/components/search/search-ui.constants";
import type { SuggestionsProvider } from "@/components/search/use-search-suggestions";
import type { HeadlessCommerceAuthConfig } from "@/features/commerce/headless/commerce-auth";
import { useGlobalSearchSuggestions } from "@/features/commerce/headless/use-global-search-suggestions";

function isActiveNavItem(href: string, activePath: string) {
  return href === activePath || (href !== "/" && activePath.startsWith(href));
}

function withCurrentQuery(href: string, currentQuery: string | undefined) {
  const trimmedQuery = currentQuery?.trim();
  return trimmedQuery ? `${href}?q=${encodeURIComponent(trimmedQuery)}` : href;
}

type HeaderSearchOverride = {
  isLoading: boolean;
  onClear: () => void;
  onQueryChange: (query: string) => void;
  onSubmit: (query: string) => void;
  provider: SuggestionsProvider;
  query: string;
};

export function Header({
  activePath,
  authConfig,
  currentQuery,
  search,
}: {
  activePath: string;
  authConfig: HeadlessCommerceAuthConfig;
  /** Last submitted/URL-resolved query, if any — used to carry `?q=` forward onto the nav links. */
  currentQuery?: string;
  search?: HeaderSearchOverride;
}) {
  const router = useRouter();
  // Only the listing page (catalog) keeps a live search box; every other page renders this
  // fallback starting blank so the search clears on navigation instead of carrying over.
  const [defaultQuery, setDefaultQuery] = useState("");
  const defaultSuggestionsProvider = useGlobalSearchSuggestions({ authConfig });

  const activeSearch: HeaderSearchOverride = search ?? {
    isLoading: false,
    onClear: () => setDefaultQuery(""),
    onQueryChange: setDefaultQuery,
    onSubmit: (nextQuery) => {
      const trimmedQuery = nextQuery.trim();
      if (trimmedQuery) {
        router.push(`/catalog?q=${encodeURIComponent(trimmedQuery)}`);
      }
    },
    provider: defaultSuggestionsProvider,
    query: defaultQuery,
  };

  return (
    <>
      <div className="announcement-bar">
        <div className="announcement-content">
          <Bell aria-hidden="true" size={15} />
          <span>{SEARCH_UI.announcement}</span>
          <a href={SEARCH_UI.announcementLink.href}>
            {SEARCH_UI.announcementLink.label}
            <ExternalLink aria-hidden="true" size={14} />
          </a>
          <button aria-label="Dismiss announcement" className="top-icon-button" type="button">
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <header className="main-header">
        <Link aria-label="RoboMotion home" className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>{SEARCH_UI.brandLabel}</span>
        </Link>

        <div className="header-search">
          <SearchBox
            autoFocus={false}
            isLoading={activeSearch.isLoading}
            onClear={activeSearch.onClear}
            onQueryChange={activeSearch.onQueryChange}
            onSubmit={activeSearch.onSubmit}
            provider={activeSearch.provider}
            query={activeSearch.query}
          />
        </div>

        <div className="header-actions">
          <button aria-label="Help" className="header-icon-button" type="button">
            <HelpCircle aria-hidden="true" size={20} />
          </button>
          <button aria-label="Apps" className="header-icon-button" type="button">
            <LayoutGrid aria-hidden="true" size={20} />
          </button>
          <button className="user-menu" type="button">
            <span>{SEARCH_UI.user.initials}</span>
            <span>{SEARCH_UI.user.name}</span>
          </button>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {SEARCH_UI.navItems.map((item) => (
            <Link
              aria-current={isActiveNavItem(item.href, activePath) ? "page" : undefined}
              href={withCurrentQuery(item.href, currentQuery)}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
