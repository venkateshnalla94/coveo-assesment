import { Bell, ExternalLink, HelpCircle, LayoutGrid, X } from "lucide-react";

import { SEARCH_UI } from "@/components/search/search-ui.constants";

export function Header() {
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
        <a aria-label="Coveo home" className="brand" href="#">
          <span className="brand-mark" aria-hidden="true" />
          <span>{SEARCH_UI.brandLabel}</span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          {SEARCH_UI.navItems.map((item) => (
            <a aria-current={item.active ? "page" : undefined} href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>

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
      </header>
    </>
  );
}
