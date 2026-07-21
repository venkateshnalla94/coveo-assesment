import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConfigurationNotice } from "./ConfigurationNotice";

describe("ConfigurationNotice", () => {
  it("renders a friendly configuration message without internal error details", () => {
    const markup = renderToStaticMarkup(
      <ConfigurationNotice
        action={{ href: "/docs", label: "Review setup" }}
        message="Update the local Coveo environment configuration, then restart the app."
        title="Search configuration required"
      />,
    );

    expect(markup).toContain("Search configuration required");
    expect(markup).toContain("Update the local Coveo environment configuration");
    expect(markup).toContain("Review setup");
    expect(markup).not.toContain("COVEO_PLATFORM_API_KEY");
    expect(markup).not.toContain("Missing required environment variable");
  });

  it("renders the loading variant with a status region", () => {
    const markup = renderToStaticMarkup(
      <ConfigurationNotice
        message="Preparing the secured Coveo search session."
        title="Initializing secure search"
        variant="loading"
      />,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain("configuration-notice-loading");
    expect(markup).toContain("Initializing secure search");
  });
});
