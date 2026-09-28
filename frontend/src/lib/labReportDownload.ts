import { LabReport } from '../types';
import { apiFetch } from './api';

export interface DownloadLabReportOptions {
  patientName: string;
  onFallbackExport?: () => void;
}

const friendlyName = (report: LabReport, ext: string) =>
  `${report.name.toLowerCase().replace(/\s+/g, '_')}_record.${ext}`;

const triggerDownload = (href: string, fileName: string) => {
  const element = document.createElement('a');
  element.href = href;
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const exportTextRecord = (report: LabReport, options: DownloadLabReportOptions) => {
  const content = `MEDICARE HEALTHCARE LABORATORY REPORT\n` +
    `======================================\n` +
    `Report: ${report.name} (${report.category})\n` +
    `Patient: ${options.patientName}\n` +
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
  triggerDownload(URL.createObjectURL(file), friendlyName(report, 'txt'));
};

export async function downloadLabReport(report: LabReport, options: DownloadLabReportOptions): Promise<void> {
  if (report.downloadUrl) {
    try {
      const res = await apiFetch(`/api/lab-reports/${report.id}/file`);
      if (!res.ok) throw new Error(`download failed: ${res.status}`);
      const blob = await res.blob();
      const ext = report.fileName?.includes('.')
        ? (report.fileName.split('.').pop() as string).toLowerCase()
        : 'bin';
      const url = URL.createObjectURL(blob);
      triggerDownload(url, friendlyName(report, ext));
      URL.revokeObjectURL(url);
      return;
    } catch {
      options.onFallbackExport?.();
    }
  }

  exportTextRecord(report, options);
}
