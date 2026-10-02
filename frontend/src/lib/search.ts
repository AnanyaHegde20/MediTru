import { UserRole } from '../types';

export interface SearchResult {
  type: 'doctor' | 'patient' | 'user' | 'appointment' | 'lab';
  id: string;
  title: string;
  subtitle: string;
}

export interface SearchNavTarget extends SearchResult {
  key: string;
  path: string;
}

function withQuery(path: string, needle: string): string {
  return `${path}?q=${encodeURIComponent(needle)}`;
}

export function mapSearchResults(results: SearchResult[], role: UserRole): SearchNavTarget[] {
  const targets: SearchNavTarget[] = [];
  for (const result of results) {
    const key = `${result.type}-${result.id}`;
    switch (result.type) {
      case 'doctor':
        if (role === 'patient') {
          targets.push({ ...result, key, path: withQuery('/patient/appointments', result.title) });
        } else if (role === 'admin') {
          targets.push({ ...result, key, path: withQuery('/admin/doctors', result.title) });
        }
        break;
      case 'patient':
        if (role === 'doctor') {
          targets.push({ ...result, key, path: withQuery('/doctor/patients', result.title) });
        } else if (role === 'admin') {
          targets.push({ ...result, key, path: withQuery('/admin/patients', result.title) });
        }
        break;
      case 'user':
        if (role === 'admin') {
          targets.push({ ...result, key, path: withQuery('/admin/users', result.title) });
        }
        break;
      case 'appointment': {
        // Subtitle is "<patient name> · <date> · <status>". Patients usually search by
        // doctor name (the title); doctors and admins usually search by patient name.
        const patientName = result.subtitle.split(' · ')[0] || result.title;
        const needle = role === 'patient' ? result.title : patientName;
        targets.push({ ...result, key, path: withQuery(`/${role}/appointments`, needle) });
        break;
      }
      case 'lab':
        if (role === 'patient') {
          targets.push({ ...result, key, path: withQuery('/patient/records', result.title) });
        } else if (role === 'doctor') {
          targets.push({ ...result, key, path: withQuery('/doctor/records', result.title) });
        }
        break;
    }
  }
  return targets;
}
