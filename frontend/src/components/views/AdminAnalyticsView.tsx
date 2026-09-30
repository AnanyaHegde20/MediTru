import React from 'react';
import { Calendar, CheckCircle2, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Appointment, Doctor } from '../../types';
import {
  AppointmentsTrendCard,
  RevenueByDoctorCard,
  SpecialtiesBarCard,
  StatusBreakdownCard,
} from '../charts/AnalyticsCharts';
import {
  deriveAppointmentsTrend,
  deriveRevenueByDoctor,
  deriveSpecialtyDistribution,
  deriveStatusBreakdown,
  totalRevenue,
} from '../../lib/analytics';

interface AdminAnalyticsViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ appointments, doctors }) => {
  const active = appointments.filter((a) => a.status !== 'Cancelled');
  const completed = appointments.filter((a) => a.status === 'Completed');
  const pending = appointments.filter((a) => a.status === 'Pending');
  const revenue = totalRevenue(appointments, doctors);

  const kpis = [
    {
      id: 'total-revenue',
      label: 'Consultation Revenue',
      value: `$${revenue.toLocaleString()}`,
      sub: `${completed.length} completed consults`,
      icon: DollarSign,
      tone: 'bg-amber-50 text-amber-600',
      subTone: 'text-amber-700 bg-amber-50',
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
      tone: 'bg-blue-50 text-blue-600',
      subTone: 'text-blue-700 bg-blue-50',
    },
    {
      id: 'active-bookings',
      label: 'Active Bookings',
      value: active.length,
      sub: 'Not cancelled',
      icon: Calendar,
      tone: 'bg-indigo-50 text-indigo-600',
      subTone: 'text-indigo-700 bg-indigo-50',
    },
  ];

  return (
    <div id="admin-analytics-screen" className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Analytics & KPIs</h2>
          <p className="text-xs text-slate-400">
            Platform-wide appointment, revenue and specialty performance
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Live data</span>
        </div>
      </div>

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
          <AppointmentsTrendCard data={deriveAppointmentsTrend(appointments)} />
        </div>
        <StatusBreakdownCard data={deriveStatusBreakdown(appointments)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpecialtiesBarCard data={deriveSpecialtyDistribution(active)} />
        <RevenueByDoctorCard data={deriveRevenueByDoctor(appointments, doctors)} />
      </div>
    </div>
  );
};
