import { SEARCH_UI } from "@/components/search/search-ui.constants";

export function Footer() {
  return (
    <footer className="app-footer">
      <a aria-label="Coveo home" className="footer-brand" href="#">
        <span className="brand-mark" aria-hidden="true" />
        <span>{SEARCH_UI.brandLabel}</span>
      </a>
      <p>{SEARCH_UI.copyright}</p>
      <nav aria-label="Footer navigation">
        {SEARCH_UI.footerLinks.map((link) => (
          <a href="#" key={link}>
            {link}
          </a>
        ))}
      </nav>
    </footer>
  );
}
