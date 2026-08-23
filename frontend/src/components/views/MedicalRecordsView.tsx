import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  Share2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  Calendar,
  X,
  Plus,
  ShieldCheck,
  FileCheck,
  Search,
} from 'lucide-react';
import { LabReport, Prescription, UserProfile } from '../../types';

interface MedicalRecordsViewProps {
  currentUser: UserProfile;
  labReports: LabReport[];
  prescriptions: Prescription[];
  selectedReport: LabReport | null;
  onSelectReport: (report: LabReport) => void;
  onAskAIAboutReport: (report: LabReport) => void;
  onAddNewReport: (report: LabReport) => void;
}

export const MedicalRecordsView: React.FC<MedicalRecordsViewProps> = ({
  currentUser,
  labReports,
  prescriptions,
  selectedReport,
  onSelectReport,
  onAskAIAboutReport,
  onAddNewReport,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'Lab Reports' | 'Prescriptions' | 'Visit History' | 'Imaging' | 'Vaccinations'
  >('Lab Reports');

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [newReportDoctor, setNewReportDoctor] = useState('Dr. Alan Stone');
  const [newReportCategory, setNewReportCategory] = useState<'Hematology' | 'Lipid' | 'Metabolic'>('Hematology');
  const [isAbnormal, setIsAbnormal] = useState(false);

  const activeReport = selectedReport || labReports[0];

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName.trim()) return;

    const report: LabReport = {
      id: `lab_${Date.now()}`,
      name: newReportName,
      category: newReportCategory,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      doctorName: newReportDoctor,
      doctorSpecialty: 'Internal Medicine',
      status: isAbnormal ? 'Abnormal' : 'Normal',
      fileSize: '1.2 MB',
      values: [
        { parameter: 'Target Marker A', value: '110', unit: 'mg/dL', referenceRange: '70 - 100', status: isAbnormal ? 'High' : 'Normal' },
        { parameter: 'Reference Marker B', value: '45', unit: 'U/L', referenceRange: '10 - 50', status: 'Normal' },
      ],
      aiSummary: {
        overview: `Clinical evaluation for ${newReportName}.`,
        keyFindings: ['Sample verified by laboratory automated diagnostic equipment.'],
        attentionItems: isAbnormal ? ['Target marker exceeds nominal baseline. Follow-up consultation advised.'] : [],
        recommendations: ['Routine follow-up in 6 months.'],
      },
    };

    onAddNewReport(report);
    onSelectReport(report);
    setShowUploadModal(false);
    setNewReportName('');
  };

  const handleDownloadReport = (report: LabReport) => {
    const element = document.createElement('a');
    const content = `MEDICARE HEALTHCARE LABORATORY REPORT\n` +
      `======================================\n` +
      `Report: ${report.name} (${report.category})\n` +
      `Patient: ${currentUser.name}\n` +
      `Date: ${report.date}\n` +
      `Doctor: ${report.doctorName} (${report.doctorSpecialty})\n` +
      `Status: ${report.status}\n\n` +
      `TEST VALUES & PARAMETERS:\n` +
      report.values.map(v => `• ${v.parameter}: ${v.value} ${v.unit} (Ref: ${v.referenceRange}) [${v.status}]`).join('\n') +
      `\n\nAI SUMMARY & FINDINGS:\n` +
      report.aiSummary.overview + '\n' +
      report.aiSummary.keyFindings.map(k => `+ ${k}`).join('\n') +
      (report.aiSummary.attentionItems.length > 0 ? '\n\nATTENTION:\n' + report.aiSummary.attentionItems.map(a => `! ${a}`).join('\n') : '') +
      `\n\nRECOMMENDATIONS:\n` +
      report.aiSummary.recommendations.map(r => `> ${r}`).join('\n');

    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${report.name.toLowerCase().replace(/\s+/g, '_')}_record.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredReports = labReports.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="medical-records-screen" className="space-y-6 animate-in fade-in duration-200">
      {/* Category Tabs & Upload CTA Header - Matches Figma Screen 6 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {(
            ['Lab Reports', 'Prescriptions', 'Visit History', 'Imaging', 'Vaccinations'] as const
          ).map((tab) => (
            <button
              key={tab}
              id={`records-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveCategoryTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategoryTab === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Upload Button */}
        <button
          id="btn-upload-record"
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Record</span>
        </button>
      </div>

      {/* Main Grid: Table on Left (2 Cols) & Document Preview + AI Summary Card on Right (1 Col) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Table View */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
              <h2 className="text-sm md:text-base font-bold text-slate-900">
                {activeCategoryTab} Directory
              </h2>
              <div className="w-56 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter records..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Table Content */}
            {activeCategoryTab === 'Lab Reports' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Report Name</th>
                      <th className="pb-3 px-2">Doctor</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReports.map((report) => {
                      const isSelected = activeReport?.id === report.id;
                      return (
                        <tr
                          key={report.id}
                          onClick={() => onSelectReport(report)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <td className="py-3.5 px-2 text-slate-500 font-medium whitespace-nowrap">
                            {report.date}
                          </td>
                          <td className="py-3.5 px-2 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>{report.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 text-slate-600 whitespace-nowrap">
                            {report.doctorName}
                          </td>
                          <td className="py-3.5 px-2 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                report.status === 'Normal'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {report.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectReport(report);
                                }}
                                title="View Document Preview"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadReport(report);
                                }}
                                title="Download Report"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Link generated to securely share ${report.name} with certified provider.`);
                                }}
                                title="Share with Doctor"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeCategoryTab === 'Prescriptions' && (
              <div className="space-y-3 pt-2">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-slate-900">
                        {rx.medicationName} <span className="text-blue-600 font-medium">({rx.dosage})</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{rx.instructions}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Prescribed by {rx.doctorName} • Refills: {rx.refillsRemaining} remaining</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {rx.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeCategoryTab !== 'Lab Reports' && activeCategoryTab !== 'Prescriptions' && (
              <div className="py-12 text-center text-slate-400 text-xs">
                <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>All verified records for {activeCategoryTab} are synchronized.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredReports.length} records</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              HIPAA & FHIR Verified
            </span>
          </div>
        </div>

        {/* Right Side Panel (On Row Click): Document Preview + AI Summary Card - Matches Figma Screen 6 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5 h-fit sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeReport?.name}</h3>
              <p className="text-[11px] text-slate-400">
                {activeReport?.date} • {activeReport?.doctorName}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                activeReport?.status === 'Normal'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {activeReport?.status}
            </span>
          </div>

          {/* AI Summary Card with Green/Red Highlight Badges */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Clinical Summary</span>
              </div>
              <button
                onClick={() => onAskAIAboutReport(activeReport)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Bot className="w-3 h-3" />
                <span>Ask AI Assistant</span>
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {activeReport?.aiSummary.overview}
            </p>

            {/* Key Findings in Green */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Key Normal Findings:</span>
              </div>
              {activeReport?.aiSummary.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="text-xs text-slate-700 pl-4 border-l-2 border-emerald-400 bg-white/60 p-1.5 rounded-r-lg"
                >
                  {finding}
                </div>
              ))}
            </div>

            {/* Abnormal Attention Items in Red/Amber */}
            {activeReport?.aiSummary.attentionItems && activeReport.aiSummary.attentionItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clinical Flag / Attention Needed:</span>
                </div>
                {activeReport.aiSummary.attentionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-rose-900 pl-4 border-l-2 border-rose-500 bg-rose-50/80 p-1.5 rounded-r-lg"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Parameters & Reference Ranges Table */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Diagnostic Markers
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {activeReport?.values.map((val, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{val.parameter}</span>
                    <div className="text-[10px] text-slate-400">Ref: {val.referenceRange} {val.unit}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{val.value} {val.unit}</span>
                    <div
                      className={`text-[10px] font-bold ${
                        val.status === 'Normal' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {val.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download & Share Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleDownloadReport(activeReport)}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => onAskAIAboutReport(activeReport)}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>Explain</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Upload Medical Document</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add lab panels, doctor prescriptions, or radiology imaging records.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag-and-drop simulated box */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-xs font-bold text-slate-800">
                  Drag & drop medical PDF or browse files
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Supports PDF, PNG, DICOM up to 25MB</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report / Test Name
                </label>
                <input
                  type="text"
                  required
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  placeholder="e.g. Hemoglobin A1c (HbA1c) Panel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newReportCategory}
                    onChange={(e: any) => setNewReportCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Lipid">Lipid</option>
                    <option value="Metabolic">Metabolic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ordering Doctor
                  </label>
                  <select
                    value={newReportDoctor}
                    onChange={(e) => setNewReportDoctor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Dr. Alan Stone">Dr. Alan Stone (Cardiology)</option>
                    <option value="Dr. Robert Mercer">Dr. Robert Mercer (General Med)</option>
                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins (Dermatology)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="flag-abnormal"
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="flag-abnormal" className="text-slate-700 font-medium">
                  Flag as Abnormal (Triggers automated doctor review alert)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Upload & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
