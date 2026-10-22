import { useCallback, useEffect, useRef, useState } from "react";
import { api, type CatalogSource, type SearchSource } from "@/shared/api";
import { toClientTrack } from "@/shared/api";
import type { Track } from "@/shared/types";
import { isAbortError } from "@/shared/utils/abort";

export interface UseSearchTracksOptions {
  enabled?: boolean;
  limit?: number;
  debounceMs?: number;
  source?: SearchSource;
}

export interface UseSearchTracksResult {
  tracks: Track[];
  loading: boolean;
  hasLoaded: boolean;
  error: Error | null;
  failedSources?: CatalogSource[];
  runNow: () => void;
}

export function useSearchTracks(
  query: string,
  options: UseSearchTracksOptions = {},
): UseSearchTracksResult {
  const { enabled = true, debounceMs = 250, source = "all" } = options;
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [failedSources, setFailedSources] = useState<CatalogSource[] | undefined>();

  const latestRequestIdRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);
  const lastFetchedKeyRef = useRef("");
  const trimmed = query.trim();
  const searchKey = `${source}\u0000${trimmed}`;
  const shouldRunSearch = enabled && trimmed.length >= 2;

  const runRequest = useCallback(async (requestId: number, q: string, key: string, controller: AbortController) => {
    setLoading(true);
    try {
      const res = await api.search(q, "track", source, controller.signal);
      if (requestId !== latestRequestIdRef.current) return;
      setTracks(
        res.items
          .filter((it) => it.type === "track")
          .map(toClientTrack),
      );
      setError(null);
      setFailedSources(res.failedSources);
      lastFetchedKeyRef.current = key;
      setHasLoaded(true);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
      if (requestId !== latestRequestIdRef.current) return;
      setTracks([]);
      setError(err instanceof Error ? err : new Error(String(err)));
      setFailedSources(undefined);
      setHasLoaded(true);
    } finally {
      if (requestId === latestRequestIdRef.current) setLoading(false);
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    }
  }, [source]);

  useEffect(() => {
    if (trimmed.length < 2) {
      latestRequestIdRef.current += 1;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
      setTracks([]);
      setHasLoaded(false);
      setLoading(false);
      setError(null);
      setFailedSources(undefined);
      lastFetchedKeyRef.current = "";
      return;
    }

    if (!enabled) return;

    if (lastFetchedKeyRef.current === searchKey && tracks.length > 0) {
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    setLoading(true);
    setFailedSources(undefined);
    const requestId = ++latestRequestIdRef.current;
    let controller: AbortController | undefined;
    const timer = setTimeout(() => {
      if (lastFetchedKeyRef.current === searchKey && tracks.length > 0) {
        setLoading(false);
        setHasLoaded(true);
        return;
      }
      controller = new AbortController();
      activeControllerRef.current = controller;
      void runRequest(requestId, trimmed, searchKey, controller);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller?.abort();
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    };
  }, [debounceMs, enabled, runRequest, searchKey, tracks.length, trimmed]);

  const runNow = useCallback(() => {
    if (!shouldRunSearch) return;
    activeControllerRef.current?.abort();
    const requestId = ++latestRequestIdRef.current;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setFailedSources(undefined);
    void runRequest(requestId, trimmed, searchKey, controller);
  }, [runRequest, searchKey, shouldRunSearch, trimmed]);

  return { tracks, loading, hasLoaded, error, failedSources, runNow };
}
