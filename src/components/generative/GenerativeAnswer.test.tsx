import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GenerativeAnswer } from "@/components/generative/GenerativeAnswer";
import { AnalyticsProviderRoot, type AnalyticsProvider } from "@/features/analytics/analytics";
import { InMemoryFeedbackProvider } from "@/features/generative/providers/feedback-provider";
import { MockGenerativeProvider } from "@/features/generative/providers/mock-generative-provider";
import { defaultSearchFeatureFlags } from "@/lib/features/search-feature-flags";

function renderGenerative({
  enabled = true,
  query = "digital transformation",
  provider = new MockGenerativeProvider(),
  analyticsProvider = { track: vi.fn() },
}: {
  enabled?: boolean;
  query?: string;
  provider?: MockGenerativeProvider;
  analyticsProvider?: AnalyticsProvider;
} = {}) {
  render(
    <AnalyticsProviderRoot enabled provider={analyticsProvider}>
      <GenerativeAnswer
        feedbackProvider={new InMemoryFeedbackProvider()}
        featureFlags={{
          ...defaultSearchFeatureFlags,
          enableGenerativeAnswers: enabled,
        }}
        provider={provider}
        query={query}
      />
    </AnalyticsProviderRoot>,
  );

  return analyticsProvider;
}

describe("GenerativeAnswer", () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("renders loading, complete answer, citations, and feedback", async () => {
    renderGenerative({ provider: new MockGenerativeProvider({ delayMs: 20 }) });

    expect(screen.getByRole("status").textContent).toContain(
      "Generating answer for digital transformation.",
    );

    expect(await screen.findByText(/Fixture-backed summary/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /The Ultimate Guide/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Read full guidance and citations" }));
    expect(screen.getByRole("dialog", { name: "AI Product Guidance" })).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: /Citations/ }));
    expect(screen.getByRole("link", { name: /The Ultimate Guide/ })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Close AI product guidance" }));

    await userEvent.click(screen.getByRole("button", { name: "Helpful" }));
    expect(await screen.findByText("Feedback submitted.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Helpful" })).toHaveProperty("disabled", true);
  });

  it("renders no-answer and error states with retry", async () => {
    const user = userEvent.setup();
    const provider = new MockGenerativeProvider({ behavior: "no-answer" });
    renderGenerative({ provider, query: "no answer" });

    expect(await screen.findByText(/No generated answer is available/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText(/No generated answer is available/)).toBeTruthy();

    cleanup();
    renderGenerative({
      provider: new MockGenerativeProvider({ behavior: "error" }),
      query: "error",
    });
    expect((await screen.findByRole("alert")).textContent).toContain("could not be loaded");
  });

  it("does not render when disabled", async () => {
    renderGenerative({ enabled: false });

    await waitFor(() => expect(screen.queryByLabelText("Generated answer")).toBeNull());
  });

  it("renders the completed answer immediately without a progressive typing delay", async () => {
    render(
      <AnalyticsProviderRoot enabled provider={{ track: vi.fn() }}>
        <GenerativeAnswer
          feedbackProvider={new InMemoryFeedbackProvider()}
          featureFlags={{
            ...defaultSearchFeatureFlags,
            enableGenerativeAnswers: true,
            enableGenerativeStreaming: true,
          }}
          provider={
            new MockGenerativeProvider({
              answer: {
                answer: "Streaming answer text.",
                citations: [],
              },
            })
          }
          query="digital transformation"
        />
      </AnalyticsProviderRoot>,
    );

    expect(await screen.findByText("Streaming answer text.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Read full guidance and citations" })).toBeTruthy();
  });

  it("can suppress citations without making sourced claims", async () => {
    const { rerender } = render(
      <AnalyticsProviderRoot enabled provider={{ track: vi.fn() }}>
        <GenerativeAnswer
          feedbackProvider={new InMemoryFeedbackProvider()}
          featureFlags={{
            ...defaultSearchFeatureFlags,
            enableGenerativeAnswers: true,
            enableGenerativeCitations: false,
          }}
          provider={new MockGenerativeProvider()}
          query="digital transformation"
        />
      </AnalyticsProviderRoot>,
    );

    expect(await screen.findByText(/Fixture-backed summary/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Read full guidance and citations" }));
    await userEvent.click(screen.getByRole("tab", { name: "Citations (0)" }));
    expect(screen.getByText("No citations are available for this answer.")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Close AI product guidance" }));

    rerender(
      <AnalyticsProviderRoot enabled provider={{ track: vi.fn() }}>
        <GenerativeAnswer
          feedbackProvider={new InMemoryFeedbackProvider()}
          featureFlags={{
            ...defaultSearchFeatureFlags,
            enableGenerativeAnswers: true,
            enableGenerativeCitations: false,
          }}
          provider={new MockGenerativeProvider()}
          query="digital transformation"
        />
      </AnalyticsProviderRoot>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Read full guidance and citations" }));
    await userEvent.click(screen.getByRole("tab", { name: "Citations (0)" }));
    expect(screen.getByText("No citations are available for this answer.")).toBeTruthy();
  });
});
