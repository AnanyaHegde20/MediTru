import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import {
  HEALTH_ASSISTANT_SYSTEM_INSTRUCTION,
  buildHealthPrompt,
} from "./prompts/healthAssistant";
import {
  CLINICAL_NOTES_SYSTEM_INSTRUCTION,
  buildClinicalNotesPrompt,
} from "./prompts/clinicalNotes";

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiClient && config.geminiApiKey) {
    aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
  }
  return aiClient;
}

export async function generateHealthResponse(
  message: string,
  reportContext?: string,
  history?: Array<{ role?: string; text?: string }>
): Promise<{ reply: string; isFallback: boolean; suggestions?: string[] }> {
  const ai = getAI();

  if (!ai) {
    return {
      reply: `Based on your query regarding "${message.slice(0, 45)}...", here is general medical educational context:\n\n` +
        `• **Overview**: Common factors include hydration levels, sleep hygiene, and stress.\n` +
        `• **Recommended Step**: Monitor symptoms for 24-48 hours. If fever >101°F or sharp localized pain occurs, seek medical evaluation.\n` +
        `• **Next Step**: We suggest scheduling a routine follow-up with our General Medicine or Cardiology specialists.`,
      isFallback: true,
      suggestions: ["Schedule consultation with Dr. Alan Stone", "Learn about preventative care"],
    };
  }

  const prompt = buildHealthPrompt(message, reportContext, history);

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: {
      systemInstruction: HEALTH_ASSISTANT_SYSTEM_INSTRUCTION,
      temperature: 0.4,
    },
  });

  const reply =
    response.text ||
    "I was unable to generate a clinical response at this moment. Please consult your physician.";

  return { reply, isFallback: false };
}

export async function generateClinicalNotes(params: {
  patientName: string;
  age?: number;
  symptoms?: string;
  vitals?: string;
  consultationTranscript?: string;
}): Promise<{ notesText: string; isFallback: boolean }> {
  const ai = getAI();

  if (!ai) {
    return {
      notesText: JSON.stringify({
        subjective: `Patient ${params.patientName} presents for follow-up evaluation. Reports persistent symptoms as described.`,
        objective: params.vitals || "BP: 120/80 mmHg, HR: 72 bpm, SpO2: 98%, Temp: 98.6°F.",
        assessment: "Stable clinical baseline with mild symptom manifestation requiring active monitoring.",
        plan: "1. Continue prescribed medication.\n2. Schedule follow-up in 4 weeks.\n3. Routine blood panel ordered.",
      }),
      isFallback: true,
    };
  }

  const prompt = buildClinicalNotesPrompt(params);

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: {
      systemInstruction: CLINICAL_NOTES_SYSTEM_INSTRUCTION,
    },
  });

  return { notesText: response.text || "", isFallback: false };
}
