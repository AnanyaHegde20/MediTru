import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';

interface AuditEntry {
  id: number;
  createdAt: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: string | null;
}

const ACTION_OPTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'REGISTERED',
  'USER_CREATED',
  'USER_UPDATED',
  'ROLE_CHANGED',
  'PASSWORD_RESET',
  'USER_DELETED',
  'AVATAR_UPDATED',
  'DOCTOR_CREATED',
  'DOCTOR_DELETED',
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_STATUS_CHANGED',
  'LAB_UPLOADED',
  'LAB_DELETED',
  'REFILL_REQUESTED',
];

const ACTION_STYLES: Record<string, string> = {
  LOGIN_SUCCESS: 'text-emerald-700 bg-emerald-100',
  LOGIN_FAILED: 'text-rose-700 bg-rose-100',
  REGISTERED: 'text-sky-700 bg-sky-100',
  USER_CREATED: 'text-blue-700 bg-blue-100',
  USER_UPDATED: 'text-slate-600 bg-slate-100',
  ROLE_CHANGED: 'text-violet-700 bg-violet-100',
  PASSWORD_RESET: 'text-amber-700 bg-amber-100',
  USER_DELETED: 'text-rose-700 bg-rose-100',
  AVATAR_UPDATED: 'text-teal-700 bg-teal-100',
  DOCTOR_CREATED: 'text-indigo-700 bg-indigo-100',
  DOCTOR_DELETED: 'text-rose-700 bg-rose-100',
  APPOINTMENT_BOOKED: 'text-emerald-700 bg-emerald-100',
  APPOINTMENT_STATUS_CHANGED: 'text-sky-700 bg-sky-100',
  LAB_UPLOADED: 'text-amber-700 bg-amber-100',
  LAB_DELETED: 'text-rose-700 bg-rose-100',
  REFILL_REQUESTED: 'text-violet-700 bg-violet-100',
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export const AuditLogView: React.FC = () => {
  const [action, setAction] = useState('');

  const list = usePagedList<AuditEntry>({
    path: '/api/audit-log',
    pageSize: 10,
    filters: { action: action || undefined },
  });

  const rows = list.items;

  return (
    <div id="audit-log-screen" className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Administrative trail of sign-ins, account changes, and record activity
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label htmlFor="select-audit-action" className="sr-only">
            Filter by action
          </label>
          <select
            id="select-audit-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatTime(entry.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{entry.actorEmail}</td>
                  <td className="py-3 px-4 text-slate-500 capitalize">{entry.actorRole}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ACTION_STYLES[entry.action] ?? 'text-slate-600 bg-slate-100'
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {entry.targetType}
                    {entry.targetId ? ` #${entry.targetId}` : ''}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={entry.detail ?? ''}>
                    {entry.detail ?? '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {list.loading
                      ? 'Loading audit entries…'
                      : list.error
                        ? list.error
                        : 'No audit entries match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>{list.totalElements} entries</span>
        <div className="flex items-center gap-3">
          <button
            id="btn-audit-prev"
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
            id="btn-audit-next"
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
