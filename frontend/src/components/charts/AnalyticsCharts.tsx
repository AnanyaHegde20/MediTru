import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DoctorRevenue, SpecialtyBar, StatusSlice, TrendPoint } from '../../lib/analytics';

const tooltipStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  fontSize: '12px',
};

export const AppointmentsTrendCard: React.FC<{ data: TrendPoint[] }> = ({ data }) => (
  <div id="chart-appointments-trend" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Appointments by Date</h3>
        <p className="text-[11px] text-slate-400">Total booked vs completed consultations per day</p>
      </div>
      <div className="flex items-center gap-3 text-xs font-medium">
        <span className="flex items-center gap-1.5 text-blue-600">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Booked
        </span>
        <span className="flex items-center gap-1.5 text-emerald-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
        </span>
      </div>
    </div>

    <div className="h-64 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="appointments"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#2563EB' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const StatusBreakdownCard: React.FC<{ data: StatusSlice[] }> = ({ data }) => (
  <div id="chart-status-breakdown" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
    <div className="pb-3 border-b border-slate-100">
      <h3 className="text-sm font-bold text-slate-900">Appointment Status Breakdown</h3>
      <p className="text-[11px] text-slate-400">Clinical session throughput distribution</p>
    </div>

    <div className="h-48 w-full flex items-center justify-center my-2">
      {data.length === 0 ? (
        <p className="text-xs text-slate-400">No appointments yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ ...tooltipStyle, fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
      {data.map((item) => (
        <div key={item.name} className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-bold text-slate-900">{item.value}%</span>
        </div>
      ))}
    </div>
  </div>
);

export const SpecialtiesBarCard: React.FC<{ data: SpecialtyBar[] }> = ({ data }) => (
  <div id="chart-specialty-bookings" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
    <div className="pb-3 border-b border-slate-100 mb-2">
      <h3 className="text-sm font-bold text-slate-900">Top Specialties by Bookings</h3>
      <p className="text-[11px] text-slate-400">Monthly patient volume per clinical specialty</p>
    </div>

    <div className="h-56 w-full">
      {data.length === 0 ? (
        <p className="text-xs text-slate-400 pt-8 text-center">No bookings yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="specialty" stroke="#94a3b8" fontSize={9} />
            <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ ...tooltipStyle, fontSize: '11px' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

export const RevenueByDoctorCard: React.FC<{ data: DoctorRevenue[] }> = ({ data }) => {
  const max = data.reduce((peak, row) => Math.max(peak, row.revenue), 0) || 1;
  return (
    <div id="chart-revenue-by-doctor" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
      <div className="pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold text-slate-900">Revenue by Doctor</h3>
        <p className="text-[11px] text-slate-400">Completed consultation earnings per provider</p>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">No completed consultations yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((row) => (
            <li key={row.doctor} data-doctor-revenue={row.doctor}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 truncate pr-2">{row.doctor}</span>
                <span className="font-bold text-slate-900">${row.revenue.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.round((row.revenue / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
