// @vitest-environment jsdom
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchResultsList } from "./SearchResultsList";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 64,
    getVirtualItems: () => [{ index: 0, key: "row-0", start: 0 }],
    measureElement: vi.fn(),
  }),
}));

vi.mock("@/features/player/ui/SongCardWithMenu", () => ({
  default: ({ title, artists }: { title: string; artists: string }) => (
    <div data-testid="song-card">{title} — {artists}</div>
  ),
}));

describe("SearchResultsList source metadata", () => {
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

  it("shows the provider badge and SoundCloud attribution in a result row", async () => {
    await act(async () => {
      root.render(
        <SearchResultsList
          items={[{
            id: "sc:7",
            _type: "track",
            title: "Night Drive",
            artists: "Artist",
            source: "soundcloud",
            externalUrl: "https://soundcloud.com/u/night-drive",
          }]}
          isArtistSearchFilter={false}
          isPlaylistSearchFilter={false}
          onPlayFromSearch={vi.fn()}
          onNavigateItem={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain("SoundCloud");
    expect(container.querySelector('a[aria-label="Open on SoundCloud"]')).not.toBeNull();
  });
});
