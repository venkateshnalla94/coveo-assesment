import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsoleLogger, NoopLogger, createCorrelationId } from "./logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes redacted structured console entries", () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);

    new ConsoleLogger("debug").info("search_started", {
      authorization: "Bearer token",
      query: "authentication",
    });

    expect(consoleInfo).toHaveBeenCalledWith(
      "[app]",
      expect.objectContaining({
        event: "search_started",
        level: "info",
        metadata: { query: "authentication" },
      }),
    );
  });

  it("routes debug, warn, and error levels through console methods", () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = new ConsoleLogger("debug");

    logger.debug("debug_event");
    logger.warn("warn_event");
    logger.error("error_event", new Error("failed"), { mode: "sample" });

    expect(consoleInfo).toHaveBeenCalledWith(
      "[app]",
      expect.objectContaining({ event: "debug_event", level: "debug" }),
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      "[app]",
      expect.objectContaining({ event: "warn_event", level: "warn" }),
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[app]",
      expect.objectContaining({
        event: "error_event",
        metadata: expect.objectContaining({ errorCode: "UNKNOWN", mode: "sample" }),
      }),
    );
  });

  it("respects the configured minimum level", () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);

    new ConsoleLogger("warn").info("ignored");

    expect(consoleInfo).not.toHaveBeenCalled();
  });

  it("supports no-op logging and correlation ids", () => {
    const logger = new NoopLogger();

    expect(() => {
      logger.debug("ignored");
      logger.info("ignored");
      logger.warn("ignored");
      logger.error("ignored", new Error("x"));
    }).not.toThrow();
    expect(createCorrelationId("search")).toMatch(/^search-/);
  });
});
