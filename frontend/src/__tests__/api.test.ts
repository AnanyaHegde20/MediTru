import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, API_ERROR_EVENT, resetApiErrorDebounce } from '../lib/api';

const okResponse = { ok: true, status: 200 };

function jsonResponse(status: number, body: Record<string, unknown> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('apiFetch retry and error UX', () => {
  beforeEach(() => {
    resetApiErrorDebounce();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries a GET once after a network failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(okResponse);
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/api/appointments');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a GET once on a transient 503', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(okResponse);
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/api/health');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry mutations', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiFetch('/api/appointments', { method: 'POST', body: '{}' })
    ).rejects.toThrow('Network error — please check your connection and try again.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('emits a global error event when a GET still fails after retrying', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    const handler = vi.fn();
    window.addEventListener(API_ERROR_EVENT, handler);

    await expect(apiFetch('/api/notifications')).rejects.toThrow(
      'Network error — please check your connection and try again.'
    );

    window.removeEventListener(API_ERROR_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.message).toContain('Network error');
  });

  it('emits a rate-limit notice for GET 429 responses without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(429));
    vi.stubGlobal('fetch', fetchMock);
    const handler = vi.fn();
    window.addEventListener(API_ERROR_EVENT, handler);

    const res = await apiFetch('/api/appointments');

    window.removeEventListener(API_ERROR_EVENT, handler);
    expect(res.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.message).toContain('Too many requests');
  });

  it('lets mutation callers surface 429s instead of double-toasting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(429)));
    const handler = vi.fn();
    window.addEventListener(API_ERROR_EVENT, handler);

    const res = await apiFetch('/api/appointments', { method: 'POST', body: '{}' });

    window.removeEventListener(API_ERROR_EVENT, handler);
    expect(res.status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
  });

  it('suppresses duplicate error events within the debounce window', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    const handler = vi.fn();
    window.addEventListener(API_ERROR_EVENT, handler);

    await expect(apiFetch('/api/a')).rejects.toThrow('Network error');
    await expect(apiFetch('/api/b')).rejects.toThrow('Network error');

    window.removeEventListener(API_ERROR_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
