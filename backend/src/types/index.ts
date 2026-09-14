export interface HealthAssistantRequest {
  message: string;
  history?: Array<{ role?: string; text?: string }>;
  reportContext?: string;
}

export interface ClinicalNotesRequest {
  patientName: string;
  age?: number;
  symptoms?: string;
  vitals?: string;
  consultationTranscript?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  isFallback?: boolean;
}
