import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePagedList } from '../hooks/usePagedList';

const envelope = {
  items: [{ id: 1 }, { id: 2 }],
  page: 0,
  size: 10,
  totalElements: 12,
  totalPages: 2,
  hasNext: true,
  hasPrevious: false,
};

function stubFetch(json: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => json });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePagedList', () => {
  it('fetches and exposes the page envelope', async () => {
    const fetchMock = stubFetch(envelope);
    const { result } = renderHook(() => usePagedList<{ id: number }>({ path: '/api/users' }));

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.totalElements).toBe(12);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrevious).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/users?page=0&size=10');
  });

  it('resets to the first page and passes q when searching', async () => {
    const fetchMock = stubFetch(envelope);
    const { result } = renderHook(() =>
      usePagedList<{ id: number }>({ path: '/api/users', pageSize: 5 })
    );
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    act(() => {
      result.current.setPage(1);
    });
    await waitFor(() => expect(fetchMock.mock.calls[1][0]).toContain('page=1'), {
      timeout: 3000,
    });

    act(() => {
      result.current.search('priya');
    });
    await waitFor(
      () => {
        const last = String(fetchMock.mock.calls.at(-1)?.[0]);
        expect(last).toContain('q=priya');
        expect(last).toContain('page=0');
      },
      { timeout: 3000 }
    );
    expect(result.current.query).toBe('priya');
    expect(result.current.page).toBe(0);
  });

  it('applies filter changes as query params', async () => {
    const fetchMock = stubFetch(envelope);
    const { result, rerender } = renderHook(
      ({ status }: { status: string | undefined }) =>
        usePagedList<{ id: number }>({ path: '/api/appointments', filters: { status } }),
      { initialProps: { status: undefined as string | undefined } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    rerender({ status: 'Cancelled' });
    await waitFor(
      () => expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('status=Cancelled'),
      { timeout: 3000 }
    );
  });

  it('treats a legacy array response as a single page', async () => {
    stubFetch([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const { result } = renderHook(() => usePagedList<{ id: number }>({ path: '/api/users' }));

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
    expect(result.current.items).toHaveLength(3);
    expect(result.current.totalElements).toBe(3);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasNext).toBe(false);
  });

  it('exposes an error when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    const { result } = renderHook(() => usePagedList<{ id: number }>({ path: '/api/users' }));

    await waitFor(() => expect(result.current.error).toBeTruthy(), { timeout: 3000 });
    expect(result.current.error).toContain('500');
  });
});
