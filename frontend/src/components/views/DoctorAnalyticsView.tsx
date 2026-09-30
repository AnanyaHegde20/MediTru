import React, { useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, DollarSign, LineChart as LineChartIcon } from 'lucide-react';
import { Appointment, Doctor, UserProfile } from '../../types';
import { useDataStore } from '../../store/useDataStore';
import { AppointmentsTrendCard, StatusBreakdownCard } from '../charts/AnalyticsCharts';
import {
  deriveAppointmentsTrend,
  deriveStatusBreakdown,
  doctorProfileId,
} from '../../lib/analytics';

interface DoctorAnalyticsViewProps {
  currentUser: UserProfile;
  appointments: Appointment[];
  doctors: Doctor[];
}

export const DoctorAnalyticsView: React.FC<DoctorAnalyticsViewProps> = ({
  currentUser,
  appointments,
  doctors,
}) => {
  const fetchDoctors = useDataStore((state) => state.fetchDoctors);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const profileId = doctorProfileId(doctors, currentUser.email);
  const myAppointments = profileId
    ? appointments.filter((a) => a.doctorId === profileId)
    : [];
  const completed = myAppointments.filter((a) => a.status === 'Completed');
  const pending = myAppointments.filter((a) => a.status === 'Pending');
  const earnings = completed.reduce(
    (sum, a) => sum + Number(doctors.find((d) => d.id === profileId)?.consultationFee || 0),
    0,
  );

  const kpis = [
    {
      id: 'total-visits',
      label: 'Total Visits',
      value: myAppointments.length,
      sub: 'All appointments',
      icon: Calendar,
      tone: 'bg-blue-50 text-blue-600',
      subTone: 'text-blue-700 bg-blue-50',
    },
    {
      id: 'completed-visits',
      label: 'Completed Visits',
      value: completed.length,
      sub: 'Sessions finished',
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-600',
      subTone: 'text-emerald-700 bg-emerald-50',
    },
    {
      id: 'pending-visits',
      label: 'Pending Visits',
      value: pending.length,
      sub: 'Awaiting confirmation',
      icon: Clock,
      tone: 'bg-amber-50 text-amber-600',
      subTone: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'earnings',
      label: 'Earnings',
      value: `$${earnings.toLocaleString()}`,
      sub: 'Completed consults',
      icon: DollarSign,
      tone: 'bg-indigo-50 text-indigo-600',
      subTone: 'text-indigo-700 bg-indigo-50',
    },
  ];

  const recent = [...myAppointments]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .slice(-5)
    .reverse();

  return (
    <div id="doctor-analytics-screen" className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">My Practice Analytics</h2>
          <p className="text-xs text-slate-400">Appointments and earnings scoped to your profile</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          <LineChartIcon className="w-3.5 h-3.5" />
          <span>{currentUser.name}</span>
        </div>
      </div>

      {!profileId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Your provider profile isn&apos;t linked to this account yet, so analytics can&apos;t be
          scoped to you. Contact an administrator to link your profile.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.id} id={`kpi-${kpi.id}`} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-slate-600">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.tone}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
              <div className={`inline-flex items-center gap-1 mt-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${kpi.subTone}`}>
                <span>{kpi.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppointmentsTrendCard data={deriveAppointmentsTrend(myAppointments)} />
        </div>
        <StatusBreakdownCard data={deriveStatusBreakdown(myAppointments)} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
          <h3 className="text-sm font-bold text-slate-900">Recent My Visits</h3>
          <span className="text-[11px] font-semibold text-slate-400">Last five appointments</span>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No appointments on your schedule yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 px-2">Patient</th>
                  <th className="pb-2 px-2">Time</th>
                  <th className="pb-2 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((apt) => (
                  <tr key={apt.id} id={`analytics-apt-${apt.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-slate-900">{apt.patientName}</td>
                    <td className="py-2.5 px-2 text-slate-400">{`${apt.date} • ${apt.time}`}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'Completed' || apt.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
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
