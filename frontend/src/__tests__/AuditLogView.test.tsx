import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditLogView } from '../components/views/AuditLogView';

const envelope = {
  items: [
    {
      id: 1,
      createdAt: '2026-04-01T10:00:00Z',
      actorEmail: 'admin@medicare.health',
      actorRole: 'admin',
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: '9',
      detail: 'patient account for new@test.com',
    },
    {
      id: 2,
      createdAt: '2026-04-01T09:00:00Z',
      actorEmail: 'priya.sharma@example.com',
      actorRole: 'patient',
      action: 'LOGIN_FAILED',
      targetType: 'session',
      targetId: null,
      detail: 'Invalid credentials',
    },
  ],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  hasNext: false,
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

describe('AuditLogView', () => {
  it('renders audit entries with action badges', async () => {
    stubFetch(envelope);
    render(<AuditLogView />);

    await waitFor(() => expect(screen.getByText('USER_CREATED')).toBeTruthy(), { timeout: 3000 });
    expect(screen.getByText('admin@medicare.health')).toBeTruthy();
    expect(screen.getByText('LOGIN_FAILED')).toBeTruthy();
    expect(screen.getByText('2 entries')).toBeTruthy();
    expect(screen.getByText('Page 1 of 1')).toBeTruthy();
  });

  it('re-requests with the selected action filter', async () => {
    const fetchMock = stubFetch(envelope);
    render(<AuditLogView />);
    await waitFor(() => expect(screen.getByText('USER_CREATED')).toBeTruthy(), { timeout: 3000 });

    fireEvent.change(screen.getByLabelText('Filter by action'), {
      target: { value: 'LOGIN_FAILED' },
    });

    await waitFor(
      () => expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('action=LOGIN_FAILED'),
      { timeout: 3000 }
    );
  });

  it('shows an empty state when nothing matches', async () => {
    stubFetch({ ...envelope, items: [], totalElements: 0 });
    render(<AuditLogView />);

    await waitFor(
      () => expect(screen.getByText('No audit entries match this filter.')).toBeTruthy(),
      { timeout: 3000 }
    );
  });
});
