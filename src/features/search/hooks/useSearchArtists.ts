import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ApiArtist, type CatalogSource, type SearchSource } from "@/shared/api";
import { isAbortError } from "@/shared/utils/abort";

export interface UseSearchArtistsOptions {
  enabled?: boolean;
  limit?: number;
  debounceMs?: number;
  source?: SearchSource;
}

export interface UseSearchArtistsResult {
  artists: ApiArtist[];
  loading: boolean;
  hasLoaded: boolean;
  error: Error | null;
  failedSources?: CatalogSource[];
  runNow: () => void;
}

export function useSearchArtists(
  query: string,
  options: UseSearchArtistsOptions = {},
): UseSearchArtistsResult {
  const { enabled = true, debounceMs = 250, source = "all" } = options;
  const [artists, setArtists] = useState<ApiArtist[]>([]);
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
      const res = await api.search(q, "artist", source, controller.signal);
      if (requestId !== latestRequestIdRef.current) return;
      setArtists(
        res.items.filter((it) => it.type === "artist"),
      );
      setError(null);
      setFailedSources(res.failedSources);
      lastFetchedKeyRef.current = key;
      setHasLoaded(true);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
      if (requestId !== latestRequestIdRef.current) return;
      setArtists([]);
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
      setArtists([]);
      setHasLoaded(false);
      setLoading(false);
      setError(null);
      setFailedSources(undefined);
      lastFetchedKeyRef.current = "";
      return;
    }

    if (!enabled) return;

    if (lastFetchedKeyRef.current === searchKey && artists.length > 0) {
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    setLoading(true);
    setFailedSources(undefined);
    const requestId = ++latestRequestIdRef.current;
    let controller: AbortController | undefined;
    const timer = setTimeout(() => {
      if (lastFetchedKeyRef.current === searchKey && artists.length > 0) {
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
  }, [artists.length, debounceMs, enabled, runRequest, searchKey, trimmed]);

  const runNow = useCallback(() => {
    if (!shouldRunSearch) return;
    activeControllerRef.current?.abort();
    const requestId = ++latestRequestIdRef.current;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setFailedSources(undefined);
    void runRequest(requestId, trimmed, searchKey, controller);
  }, [runRequest, searchKey, shouldRunSearch, trimmed]);

  return { artists, loading, hasLoaded, error, failedSources, runNow };
}
