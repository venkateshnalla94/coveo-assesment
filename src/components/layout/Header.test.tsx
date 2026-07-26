import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { Header } from "@/components/layout/Header";

const configurationErrorAuthConfig = {
  message: "not configured",
  mode: "configuration-error" as const,
};

afterEach(() => {
  cleanup();
  pushMock.mockClear();
});

describe("Header", () => {
  it("navigates to the catalog with the submitted query when no search override is provided", async () => {
    render(<Header activePath="/" authConfig={configurationErrorAuthConfig} />);

    const input = screen.getByRole("combobox", { name: "Search" });
    await userEvent.type(input, "gripper");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(pushMock).toHaveBeenCalledWith("/catalog?q=gripper");
  });

  it("does not navigate when the submitted query is blank", async () => {
    render(<Header activePath="/" authConfig={configurationErrorAuthConfig} />);

    const input = screen.getByRole("combobox", { name: "Search" });
    await userEvent.type(input, "   ");

    expect(screen.getByRole("button", { name: "Search" }).getAttribute("disabled")).not.toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clears the query through the default uncontrolled search state", async () => {
    render(<Header activePath="/" authConfig={configurationErrorAuthConfig} />);

    const input = screen.getByRole("combobox", { name: "Search" });
    await userEvent.type(input, "servo motor");
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect((screen.getByRole("combobox", { name: "Search" }) as HTMLInputElement).value).toBe("");
  });

  it("renders the provided search override instead of building its own suggestions engine", async () => {
    const onSubmit = vi.fn();
    const onQueryChange = vi.fn();
    const onClear = vi.fn();

    render(
      <Header
        activePath="/catalog"
        authConfig={configurationErrorAuthConfig}
        search={{
          isLoading: false,
          onClear,
          onQueryChange,
          onSubmit,
          provider: { getSuggestions: vi.fn().mockResolvedValue([]) },
          query: "welding arm",
        }}
      />,
    );

    expect((screen.getByRole("combobox", { name: "Search" }) as HTMLInputElement).value).toBe(
      "welding arm",
    );

    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onSubmit).toHaveBeenCalledWith("welding arm");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("marks the active nav item and renders the Blog nav link", () => {
    render(<Header activePath="/catalog" authConfig={configurationErrorAuthConfig} />);

    expect(screen.getByRole("button", { name: "Products" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("aria-current")).toBeNull();
  });

  it("appends the current query onto the Blog nav link when provided", () => {
    render(
      <Header
        activePath="/catalog"
        authConfig={configurationErrorAuthConfig}
        currentQuery="welding arm"
      />,
    );

    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe(
      "/blog?q=welding%20arm",
    );
  });

  it("leaves the Blog nav link href unchanged when the current query is absent or blank", () => {
    const { rerender } = render(
      <Header activePath="/catalog" authConfig={configurationErrorAuthConfig} />,
    );

    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog");

    rerender(
      <Header activePath="/catalog" authConfig={configurationErrorAuthConfig} currentQuery="   " />,
    );

    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog");
  });

  it("shows the product categories on hover and navigates to the catalog with the selected category as the query", async () => {
    render(<Header activePath="/" authConfig={configurationErrorAuthConfig} />);

    expect(screen.queryByRole("menuitem", { name: "Drive Systems" })).toBeNull();

    await userEvent.hover(screen.getByRole("button", { name: "Products" }));
    const category = await screen.findByRole("menuitem", { name: "Drive Systems" });

    await userEvent.click(category);

    expect(pushMock).toHaveBeenCalledWith("/catalog?q=Drive%20Systems");
  });

  it("renders the uncontrolled search input blank even when a current query is carried over", () => {
    render(
      <Header
        activePath="/catalog"
        authConfig={configurationErrorAuthConfig}
        currentQuery="servo motor"
      />,
    );

    expect((screen.getByRole("combobox", { name: "Search" }) as HTMLInputElement).value).toBe(
      "",
    );
  });
});
