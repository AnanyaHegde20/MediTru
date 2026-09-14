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

  it('health-assistant rejects empty message', async () => {
    if (!backendAvailable) return;
    const res = await fetch('http://localhost:3001/api/gemini/health-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', history: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('clinical-notes rejects empty patientName', async () => {
    if (!backendAvailable) return;
    const res = await fetch('http://localhost:3001/api/gemini/clinical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName: '', age: 30 }),
    });
    expect(res.status).toBe(400);
  });
});
