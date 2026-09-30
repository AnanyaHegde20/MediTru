import { describe, expect, it } from 'vitest';
import { filenameFromDisposition } from '../lib/csvDownload';

describe('filenameFromDisposition', () => {
  it('extracts the filename from a Content-Disposition header', () => {
    expect(
      filenameFromDisposition('attachment; filename="appointments.csv"', 'fallback.csv'),
    ).toBe('appointments.csv');
    expect(filenameFromDisposition('attachment; filename=users.csv', 'f.csv')).toBe('users.csv');
  });

  it('falls back when the header is missing or has no filename', () => {
    expect(filenameFromDisposition(null, 'fallback.csv')).toBe('fallback.csv');
    expect(filenameFromDisposition('inline', 'fallback.csv')).toBe('fallback.csv');
  });
});
