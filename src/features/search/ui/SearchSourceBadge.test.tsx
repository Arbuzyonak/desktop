// @vitest-environment jsdom
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchSourceBadge } from "./SearchSourceBadge";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SearchSourceBadge", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders readable YouTube and SoundCloud names", async () => {
    await act(async () => {
      root.render(
        <>
          <SearchSourceBadge source="youtube" />
          <SearchSourceBadge source="soundcloud" />
        </>,
      );
    });

    expect(container.textContent).toContain("YouTube Music");
    expect(container.textContent).toContain("SoundCloud");
  });

  it("renders safe SoundCloud attribution and stops row playback", async () => {
    const onRowClick = vi.fn();
    await act(async () => {
      root.render(
        <div onClick={onRowClick}>
          <SearchSourceBadge
            source="soundcloud"
            externalUrl="https://soundcloud.com/u/t"
          />
        </div>,
      );
    });

    const link = container.querySelector('a[aria-label="Open on SoundCloud"]') as HTMLAnchorElement;
    expect(link.target).toBe("_blank");
    expect(link.rel.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
    act(() => link.click());
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("renders nothing for legacy results without a source", async () => {
    await act(async () => {
      root.render(<SearchSourceBadge />);
    });

    expect(container.innerHTML).toBe("");
  });

  it("does not link an untrusted external URL", async () => {
    await act(async () => {
      root.render(
        <SearchSourceBadge
          source="soundcloud"
          externalUrl="https://example.com/not-soundcloud"
        />,
      );
    });

    expect(container.textContent).toContain("SoundCloud");
    expect(container.querySelector("a")).toBeNull();
  });
});
