import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Download, Search, Stethoscope, User } from 'lucide-react';
import { Appointment, UserProfile } from '../../types';
import { useToast } from '../Toast';
import { downloadCsv } from '../../lib/csvDownload';
import { usePagedList } from '../../hooks/usePagedList';

interface AppointmentsListViewProps {
  currentUser: UserProfile;
  onUpdateStatus: (id: string, status: Appointment['status']) => Promise<void>;
}

const STATUS_STYLES: Record<Appointment['status'], string> = {
  Confirmed: 'text-emerald-700 bg-emerald-100',
  Pending: 'text-amber-700 bg-amber-100',
  'In Progress': 'text-blue-700 bg-blue-100',
  Completed: 'text-slate-600 bg-slate-100',
  Cancelled: 'text-rose-700 bg-rose-100',
};

const STATUS_FILTERS = ['All', 'Confirmed', 'Pending', 'In Progress', 'Completed', 'Cancelled'] as const;

interface RowAction {
  label: string;
  next: Appointment['status'];
  danger?: boolean;
}

export const AppointmentsListView: React.FC<AppointmentsListViewProps> = ({
  currentUser,
  onUpdateStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const list = usePagedList<Appointment>({
    path: '/api/appointments',
    pageSize: 10,
    initialQuery: searchParams.get('q') ?? '',
    filters: { status: statusFilter === 'All' ? undefined : statusFilter },
  });

  useEffect(() => {
    list.search(searchParams.get('q') ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const showPatient = currentUser.role !== 'patient';
  const showDoctor = currentUser.role !== 'doctor';

  const rows: Appointment[] = list.items.map((apt) => ({ ...apt, id: String(apt.id) }));

  const handleExport = async () => {
    try {
      await downloadCsv('/api/appointments/export', 'appointments.csv');
      showToast('Appointments CSV exported.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not export the CSV.', 'error');
    }
  };

  const actionsFor = (apt: Appointment): RowAction[] => {
    if (currentUser.role === 'doctor' || currentUser.role === 'admin') {
      if (apt.status === 'Pending') {
        return [
          { label: 'Confirm', next: 'Confirmed' },
          { label: 'Cancel', next: 'Cancelled', danger: true },
        ];
      }
      if (apt.status === 'Confirmed') {
        return [
          { label: 'Start', next: 'In Progress' },
          { label: 'Cancel', next: 'Cancelled', danger: true },
        ];
      }
      if (apt.status === 'In Progress') {
        return [{ label: 'Complete', next: 'Completed' }];
      }
      return [];
    }
    const owns = apt.patientId === currentUser.id;
    if (owns && (apt.status === 'Pending' || apt.status === 'Confirmed')) {
      return [{ label: 'Cancel', next: 'Cancelled', danger: true }];
    }
    return [];
  };

  const handleAction = async (apt: Appointment, action: RowAction) => {
    setBusyId(apt.id);
    try {
      await onUpdateStatus(apt.id, action.next);
      showToast(`Appointment marked as ${action.next}.`);
      list.refresh();
    } catch {
      showToast('Could not update appointment status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

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
          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' && (
              <button
                id="btn-export-appointments-csv"
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-appointments-search"
              type="text"
              value={list.query}
              onChange={(e) => list.search(e.target.value)}
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
        {list.loading && rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading appointments…</div>
        ) : list.error && rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-rose-500">{list.error}</div>
        ) : rows.length === 0 ? (
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
                  <th className="pb-3 pr-4 font-bold">Status</th>
                  <th className="pb-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((apt) => (
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
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          STATUS_STYLES[apt.status] ?? 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {actionsFor(apt).map((action) => (
                          <button
                            key={action.label}
                            onClick={() => handleAction(apt, action)}
                            disabled={busyId === apt.id}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer ${
                              action.danger
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>{list.totalElements} appointments</span>
        <div className="flex items-center gap-3">
          <button
            id="btn-appointments-prev"
            type="button"
            onClick={() => list.setPage(Math.max(0, list.page - 1))}
            disabled={!list.hasPrevious || list.loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span>
            Page {list.page + 1} of {Math.max(list.totalPages, 1)}
          </span>
          <button
            id="btn-appointments-next"
            type="button"
            onClick={() => list.setPage(list.page + 1)}
            disabled={!list.hasNext || list.loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
