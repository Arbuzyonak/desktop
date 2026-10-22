// @vitest-environment jsdom
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchSourceSelector } from "./SearchSourceSelector";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SearchSourceSelector", () => {
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

  it("renders exactly three accessible source controls and marks the selection", async () => {
    await act(async () => {
      root.render(<SearchSourceSelector value="youtube" onChange={vi.fn()} />);
    });

    const controls = Array.from(container.querySelectorAll("button"));
    expect(controls).toHaveLength(3);
    expect(controls.map((control) => control.getAttribute("aria-label"))).toEqual([
      "All sources",
      "YouTube Music",
      "SoundCloud",
    ]);
    expect(controls.map((control) => control.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
  });

  it("selects SoundCloud when clicked", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(<SearchSourceSelector value="all" onChange={onChange} />);
    });

    const soundcloud = container.querySelector('button[aria-label="SoundCloud"]') as HTMLButtonElement;
    act(() => soundcloud.click());

    expect(onChange).toHaveBeenCalledWith("soundcloud");
  });

  it("uses native buttons so keyboard activation follows platform behavior", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(<SearchSourceSelector value="all" onChange={onChange} />);
    });

    const youtube = container.querySelector('button[aria-label="YouTube Music"]') as HTMLButtonElement;
    youtube.focus();
    act(() => youtube.click());

    expect(document.activeElement).toBe(youtube);
    expect(youtube.tagName).toBe("BUTTON");
    expect(onChange).toHaveBeenCalledWith("youtube");
  });
});
