// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DropdownMenu from "./DropdownMenu";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("DropdownMenu", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.replaceChildren();
  });

  async function openMenu(items: React.ComponentProps<typeof DropdownMenu>["items"]): Promise<void> {
    await act(async () => {
      root.render(
        <DropdownMenu
          trigger={<button type="button">Open menu</button>}
          items={items}
        />,
      );
    });
    act(() => {
      (container.querySelector("button") as HTMLButtonElement).click();
    });
  }

  it("exposes checked items as menu item checkboxes with a visible check", async () => {
    await openMenu([{ id: "youtube", label: "YouTube Music", checked: true, onClick: vi.fn() }]);

    const item = document.body.querySelector('[role="menuitemcheckbox"]');
    expect(item?.getAttribute("aria-checked")).toBe("true");
    expect(item?.querySelector('[data-dropdown-check="true"]')).not.toBeNull();
  });

  it("keeps the menu open when a multi-select item is activated", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    await act(async () => {
      root.render(
        <DropdownMenu
          open
          onOpenChange={onOpenChange}
          trigger={<button type="button">Open menu</button>}
          items={[{
            id: "soundcloud",
            label: "SoundCloud",
            closeOnSelect: false,
            onClick,
          }]}
        />,
      );
    });

    const item = document.body.querySelector("[data-dropdown-menu] button") as HTMLButtonElement;
    await act(async () => item.click());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
