export const CLINICAL_NOTES_SYSTEM_INSTRUCTION =
  "You are an AI Clinical Scribe for medical professionals. Return a concise, high-standard professional medical SOAP note with clear Subjective, Objective, Assessment, and Plan sections.";

export function buildClinicalNotesPrompt(params: {
  patientName: string;
  age?: number;
  symptoms?: string;
  vitals?: string;
  consultationTranscript?: string;
}): string {
  return `Generate a structured SOAP (Subjective, Objective, Assessment, Plan) clinical summary for:
Patient: ${params.patientName}, Age: ${params.age || "N/A"}
Vitals: ${params.vitals || "BP: 124/82, HR: 74, SpO2: 99%"}
Patient Symptoms & Notes: ${params.symptoms || params.consultationTranscript || "Routine check-up"}`;
}
