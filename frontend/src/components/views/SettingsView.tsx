import React from 'react';

export const SettingsView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Application & Service Settings</h2>
          <p className="text-xs text-slate-400">Configure notifications and security protocols</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/80 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Integrations</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span>Gemini 3.7 AI Health Engine</span>
              <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[10px]">Active</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span>FHIR HL7 Diagnostic Protocol</span>
              <span className="text-blue-700 bg-blue-100 font-bold px-2 py-0.5 rounded-full text-[10px]">Connected</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span>MongoDB 7.0 Persistence Layer</span>
              <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[10px]">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
