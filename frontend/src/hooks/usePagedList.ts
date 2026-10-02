import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';

export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  facets?: Record<string, number>;
}

interface UsePagedListOptions {
  path: string;
  pageSize?: number;
  initialQuery?: string;
  filters?: Record<string, string | undefined>;
}

export function usePagedList<T>(options: UsePagedListOptions) {
  const { path, pageSize = 10, initialQuery = '' } = options;
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState(initialQuery);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filtersRef = useRef(options.filters);
  filtersRef.current = options.filters;
  const filtersKey = JSON.stringify(options.filters ?? {});
  const seqRef = useRef(0);

  const load = useCallback(async () => {
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('size', String(pageSize));
      const q = query.trim();
      if (q) params.set('q', q);
      for (const [key, value] of Object.entries(filtersRef.current ?? {})) {
        if (value) params.set(key, value);
      }
      const res = await apiFetch(`${path}?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: unknown = await res.json();
      if (seq !== seqRef.current) return;
      if (Array.isArray(data)) {
        setItems(data as T[]);
        setMeta({
          page: 0,
          size: data.length,
          totalElements: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
      } else {
        const envelope = data as Record<string, unknown>;
        const serverPage = Number(envelope.page ?? 0);
        setItems(Array.isArray(envelope.items) ? (envelope.items as T[]) : []);
        setMeta({
          page: serverPage,
          size: Number(envelope.size ?? pageSize),
          totalElements: Number(envelope.totalElements ?? 0),
          totalPages: Number(envelope.totalPages ?? 0),
          hasNext: Boolean(envelope.hasNext),
          hasPrevious: Boolean(envelope.hasPrevious),
          facets: envelope.facets as Record<string, number> | undefined,
        });
        if (serverPage !== page) setPage(serverPage);
      }
    } catch (err) {
      if (seq !== seqRef.current) return;
      setError(err instanceof Error ? err.message : 'Could not load list.');
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, [path, page, pageSize, query, filtersKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load, refreshKey]);

  const search = useCallback((value: string) => {
    setQuery(value);
    setPage(0);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return {
    items,
    page,
    query,
    meta,
    loading,
    error,
    search,
    setPage,
    refresh,
    totalElements: meta?.totalElements ?? 0,
    totalPages: meta?.totalPages ?? 0,
    hasNext: meta?.hasNext ?? false,
    hasPrevious: meta?.hasPrevious ?? false,
    facets: meta?.facets,
  };
}
