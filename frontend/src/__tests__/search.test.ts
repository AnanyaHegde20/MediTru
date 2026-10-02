import { describe, it, expect } from 'vitest';
import { mapSearchResults, SearchResult } from '../lib/search';

const doctor: SearchResult = { type: 'doctor', id: '7', title: 'Dr. Sarah Jenkins', subtitle: 'Dermatology · City Hospital' };
const patient: SearchResult = { type: 'patient', id: '3', title: 'Priya Sharma', subtitle: 'priya.sharma@example.com' };
const user: SearchResult = { type: 'user', id: '1', title: 'Rajesh Kumar', subtitle: 'rajesh@medicare.health · doctor' };
const appointment: SearchResult = { type: 'appointment', id: '9', title: 'Dr. Alan Stone', subtitle: 'Priya Sharma · Jan 2, 2026 · Pending' };
const lab: SearchResult = { type: 'lab', id: '4', title: 'Lipid Panel', subtitle: 'Lipid · Jan 1, 2026 · Normal' };

describe('mapSearchResults', () => {
  it('maps doctor results for patients to the booking view with a query', () => {
    const mapped = mapSearchResults([doctor], 'patient');
    expect(mapped).toHaveLength(1);
    expect(mapped[0].path).toBe('/patient/appointments?q=Dr.%20Sarah%20Jenkins');
    expect(mapped[0].key).toBe('doctor-7');
  });

  it('maps doctor results for admins to the directory', () => {
    expect(mapSearchResults([doctor], 'admin')[0].path).toBe('/admin/doctors?q=Dr.%20Sarah%20Jenkins');
  });

  it('never sends doctors to doctors', () => {
    expect(mapSearchResults([doctor], 'doctor')).toHaveLength(0);
  });

  it('maps patient results for doctors and admins', () => {
    expect(mapSearchResults([patient], 'doctor')[0].path).toBe('/doctor/patients?q=Priya%20Sharma');
    expect(mapSearchResults([patient], 'admin')[0].path).toBe('/admin/patients?q=Priya%20Sharma');
    expect(mapSearchResults([patient], 'patient')).toHaveLength(0);
  });

  it('maps user results only for admins', () => {
    expect(mapSearchResults([user], 'admin')[0].path).toBe('/admin/users?q=Rajesh%20Kumar');
    expect(mapSearchResults([user], 'doctor')).toHaveLength(0);
    expect(mapSearchResults([user], 'patient')).toHaveLength(0);
  });

  it('deep-links appointments by doctor name for patients and patient name for staff', () => {
    expect(mapSearchResults([appointment], 'patient')[0].path).toBe(
      '/patient/appointments?q=Dr.%20Alan%20Stone'
    );
    expect(mapSearchResults([appointment], 'doctor')[0].path).toBe(
      '/doctor/appointments?q=Priya%20Sharma'
    );
    expect(mapSearchResults([appointment], 'admin')[0].path).toBe(
      '/admin/appointments?q=Priya%20Sharma'
    );
  });

  it('maps lab results to the records view for patients and doctors only', () => {
    expect(mapSearchResults([lab], 'patient')[0].path).toBe('/patient/records?q=Lipid%20Panel');
    expect(mapSearchResults([lab], 'doctor')[0].path).toBe('/doctor/records?q=Lipid%20Panel');
    expect(mapSearchResults([lab], 'admin')).toHaveLength(0);
  });

  it('keeps unique keys across types', () => {
    const mapped = mapSearchResults([doctor, appointment, lab], 'patient');
    const keys = mapped.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
