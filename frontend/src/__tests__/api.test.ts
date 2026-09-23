import { describe, it, expect, beforeAll } from 'vitest';

let backendAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/health');
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
});

describe('API health endpoint (integration)', () => {
  it('backend health check returns ok', async () => {
    if (!backendAvailable) return;
    const res = await fetch('http://localhost:3001/api/health');
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(typeof data.hasGeminiKey).toBe('boolean');
  });

  it('protected endpoint rejects requests without a token', async () => {
    if (!backendAvailable) return;
    const res = await fetch('http://localhost:3001/api/doctors');
    expect(res.status).toBe(401);
  });

  it('health-assistant rejects empty message when authenticated', async () => {
    if (!backendAvailable) return;
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medicare.health', password: 'password' }),
    });
    if (!loginRes.ok) return; // seeded users not present
    const { token } = await loginRes.json();

    const res = await fetch('http://localhost:3001/api/gemini/health-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: '', history: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('login rejects wrong password', async () => {
    if (!backendAvailable) return;
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@medicare.health', password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
  });
});
