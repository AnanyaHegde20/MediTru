import { Prescription } from '../types';

export interface DownloadPrescriptionOptions {
  patientName: string;
}

const friendlyName = (rx: Prescription) =>
  `${rx.medicationName.toLowerCase().replace(/\s+/g, '_')}_prescription.txt`;

const triggerDownload = (href: string, fileName: string) => {
  const element = document.createElement('a');
  element.href = href;
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export function downloadPrescription(
  rx: Prescription,
  options: DownloadPrescriptionOptions
): void {
  const content =
    `MEDICARE HEALTHCARE PRESCRIPTION\n` +
    `================================\n` +
    `Medication: ${rx.medicationName} (${rx.dosage})\n` +
    `Patient: ${options.patientName}\n` +
    `Frequency: ${rx.frequency}\n` +
    `Prescribed by: ${rx.doctorName} (${rx.specialty})\n` +
    `Start: ${rx.startDate}${rx.endDate ? ` - End: ${rx.endDate}` : ''}\n` +
    `Status: ${rx.status}\n` +
    `Refills: ${rx.refillsRemaining} of ${rx.totalRefills} remaining\n` +
    (rx.pharmacy ? `Pharmacy: ${rx.pharmacy}\n` : '') +
    `\nInstructions:\n${rx.instructions}\n`;

  const file = new Blob([content], { type: 'text/plain' });
  triggerDownload(URL.createObjectURL(file), friendlyName(rx));
}
