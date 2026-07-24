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

  it("marks the active nav item and renders both nav links", () => {
    render(<Header activePath="/catalog" authConfig={configurationErrorAuthConfig} />);

    expect(screen.getByRole("link", { name: "Products" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("aria-current")).toBeNull();
  });
});
