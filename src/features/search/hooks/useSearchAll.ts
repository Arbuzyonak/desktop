import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ApiSearchItem, type CatalogSource, type SearchSource } from "@/shared/api";
import { isAbortError } from "@/shared/utils/abort";

export interface UseSearchAllOptions {
  enabled: boolean;
  limit: number;
  debounceMs: number;
  source?: SearchSource;
}

export interface UseSearchAllResult {
  items: ApiSearchItem[];
  loading: boolean;
  hasLoaded: boolean;
  failedSources?: CatalogSource[];
  runNow: () => void;
}

export function useSearchAll(
  query: string,
  options: UseSearchAllOptions,
): UseSearchAllResult {
  const { source = "all" } = options;
  const [items, setItems] = useState<ApiSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [failedSources, setFailedSources] = useState<CatalogSource[] | undefined>();

  const latestRequestIdRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);
  const lastFetchedKeyRef = useRef("");
  const trimmed = query.trim();
  const searchKey = `${source}\u0000${trimmed}`;
  const shouldRunSearch = options.enabled && trimmed.length >= 2;

  const runRequest = useCallback(
    async (requestId: number, q: string, key: string, controller: AbortController) => {
      setLoading(true);
      try {
        const res = await api.search(q, "all", source, controller.signal);
        if (requestId !== latestRequestIdRef.current) return;
        setItems(res.items);
        setFailedSources(res.failedSources);
        lastFetchedKeyRef.current = key;
        setHasLoaded(true);
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        if (requestId !== latestRequestIdRef.current) return;
        setItems([]);
        setFailedSources(undefined);
        setHasLoaded(true);
      } finally {
        if (requestId === latestRequestIdRef.current) setLoading(false);
        if (activeControllerRef.current === controller) activeControllerRef.current = null;
      }
    },
    [source],
  );

  useEffect(() => {
    if (trimmed.length < 2) {
      latestRequestIdRef.current += 1;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
      setItems([]);
      setHasLoaded(false);
      setLoading(false);
      setFailedSources(undefined);
      lastFetchedKeyRef.current = "";
      return;
    }

    if (!options.enabled) return;

    if (lastFetchedKeyRef.current === searchKey && items.length > 0) {
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    setLoading(true);
    setFailedSources(undefined);
    const requestId = ++latestRequestIdRef.current;
    let controller: AbortController | undefined;
    const timer = setTimeout(() => {
      if (lastFetchedKeyRef.current === searchKey && items.length > 0) {
        setLoading(false);
        setHasLoaded(true);
        return;
      }
      controller = new AbortController();
      activeControllerRef.current = controller;
      void runRequest(requestId, trimmed, searchKey, controller);
    }, options.debounceMs ?? 320);

    return () => {
      clearTimeout(timer);
      controller?.abort();
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    };
  }, [items.length, options.debounceMs, options.enabled, runRequest, searchKey, trimmed]);

  const runNow = useCallback(() => {
    if (!shouldRunSearch) return;
    activeControllerRef.current?.abort();
    const requestId = ++latestRequestIdRef.current;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setFailedSources(undefined);
    void runRequest(requestId, trimmed, searchKey, controller);
  }, [runRequest, searchKey, shouldRunSearch, trimmed]);

  return { items, loading, hasLoaded, failedSources, runNow };
}
