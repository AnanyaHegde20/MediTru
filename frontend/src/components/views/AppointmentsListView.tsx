import React, { useMemo, useState } from 'react';
import { Calendar, Search, Stethoscope, User } from 'lucide-react';
import { Appointment, UserProfile } from '../../types';

interface AppointmentsListViewProps {
  appointments: Appointment[];
  currentUser: UserProfile;
}

const STATUS_STYLES: Record<Appointment['status'], string> = {
  Confirmed: 'text-emerald-700 bg-emerald-100',
  Pending: 'text-amber-700 bg-amber-100',
  'In Progress': 'text-blue-700 bg-blue-100',
  Completed: 'text-slate-600 bg-slate-100',
  Cancelled: 'text-rose-700 bg-rose-100',
};

const STATUS_FILTERS = ['All', 'Confirmed', 'Pending', 'In Progress', 'Completed', 'Cancelled'] as const;

export const AppointmentsListView: React.FC<AppointmentsListViewProps> = ({
  appointments,
  currentUser,
}) => {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All');
  const [query, setQuery] = useState('');

  const showPatient = currentUser.role !== 'patient';
  const showDoctor = currentUser.role !== 'doctor';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((apt) => {
      const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
      const matchesQuery =
        !q ||
        apt.patientName?.toLowerCase().includes(q) ||
        apt.doctorName?.toLowerCase().includes(q) ||
        apt.specialty?.toLowerCase().includes(q) ||
        apt.type?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [appointments, statusFilter, query]);

  return (
    <div id="appointments-list-screen" className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">Appointments</h2>
            <p className="text-xs text-slate-400">
              {currentUser.role === 'doctor'
                ? 'Your consultation schedule and patient visits'
                : 'All appointments across the platform'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by patient, doctor, or specialty..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No appointments match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  {showPatient && <th className="pb-3 pr-4 font-bold">Patient</th>}
                  {showDoctor && <th className="pb-3 pr-4 font-bold">Doctor</th>}
                  <th className="pb-3 pr-4 font-bold">Specialty</th>
                  <th className="pb-3 pr-4 font-bold">Date</th>
                  <th className="pb-3 pr-4 font-bold">Time</th>
                  <th className="pb-3 pr-4 font-bold">Type</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt) => (
                  <tr key={apt.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    {showPatient && (
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          {apt.patientAvatar ? (
                            <img
                              src={apt.patientAvatar}
                              alt={apt.patientName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          )}
                          <span className="font-semibold text-slate-900">{apt.patientName}</span>
                        </div>
                      </td>
                    )}
                    {showDoctor && (
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-medium text-slate-700">{apt.doctorName}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-3 pr-4 text-slate-600">{apt.specialty}</td>
                    <td className="py-3 pr-4 text-slate-600">{apt.date}</td>
                    <td className="py-3 pr-4 text-slate-600">{apt.time}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{apt.type}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          STATUS_STYLES[apt.status] ?? 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
