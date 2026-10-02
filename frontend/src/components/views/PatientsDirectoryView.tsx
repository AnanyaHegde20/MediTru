import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { Appointment, LabReport, UserProfile } from '../../types';
import { useDataStore } from '../../store/useDataStore';

interface PatientsDirectoryViewProps {
  patients: UserProfile[];
  appointments: Appointment[];
  labReports: LabReport[];
  showViewChart: boolean;
  onSelectReport?: (report: LabReport | null) => void;
  onNavigateToRecords?: () => void;
  onOpenClinicalNotes: (patientName: string) => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export const PatientsDirectoryView: React.FC<PatientsDirectoryViewProps> = ({
  patients,
  appointments,
  labReports,
  showViewChart,
  onSelectReport,
  onNavigateToRecords,
  onOpenClinicalNotes,
}) => {
  const { fetchPatients } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    fetchPatients().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePatients = normalizedQuery
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(normalizedQuery) ||
          (p.email ?? '').toLowerCase().includes(normalizedQuery) ||
          (p.medicalCondition ?? '').toLowerCase().includes(normalizedQuery)
      )
    : patients;

  const lastVisitFor = (name: string) =>
    appointments.find((a) => a.patientName === name);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Registered Patient Directory</h2>
          <p className="text-xs text-slate-400">Manage patient charts, EHR records, and consultation history</p>
        </div>
        <div className="relative w-56 max-w-full shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-patient-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-xs text-slate-400">
          <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin align-middle mr-2" />
          Loading patients…
        </div>
      ) : patients.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400">
          No patients registered yet.
        </div>
      ) : visiblePatients.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400">
          No patients match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {visiblePatients.map((p) => {
            const visit = lastVisitFor(p.name);
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 border border-slate-200 flex items-center justify-center text-xs font-bold">
                      {initials(p.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm font-bold text-slate-900">
                      {p.name}
                      {p.age != null ? ` (${p.age}y)` : ''}
                    </div>
                    <div className="text-[11px] text-blue-600 font-medium">
                      {p.medicalCondition || 'No recorded condition'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {visit
                        ? `Care: ${visit.doctorName} • Last: ${visit.date}`
                        : 'No appointments yet'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  {showViewChart ? (
                    <button
                      onClick={() => {
                        const report = labReports.find(
                          (r) => String(r.patientId) === String(p.id)
                        );
                        onSelectReport?.(report ?? null);
                        onNavigateToRecords?.();
                      }}
                      className="text-[11px] font-semibold text-slate-600 hover:text-blue-600"
                    >
                      View Chart
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={() => onOpenClinicalNotes(p.name)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>SOAP Note</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
