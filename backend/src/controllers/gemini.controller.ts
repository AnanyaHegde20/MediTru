import { Request, Response } from "express";
import { sanitize, isNonEmptyString } from "../utils/validators";
import { generateHealthResponse, generateClinicalNotes } from "../services/gemini.service";

export async function healthAssistant(req: Request, res: Response): Promise<void> {
  try {
    const { message, history = [], reportContext } = req.body;

    if (!isNonEmptyString(message, 5000)) {
      res.status(400).json({
        error: "Invalid input",
        message: "'message' must be a non-empty string (max 5000 chars).",
      });
      return;
    }

    const cleanMessage = sanitize(message, 5000);
    const cleanReportContext =
      reportContext && typeof reportContext === "string"
        ? sanitize(reportContext, 10000)
        : undefined;

    const cleanHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .map((h: { role?: string; text?: string }) => ({
            role: typeof h.role === "string" ? sanitize(h.role, 50) : "unknown",
            text: typeof h.text === "string" ? sanitize(h.text, 2000) : "",
          }))
      : [];

    const result = await generateHealthResponse(cleanMessage, cleanReportContext, cleanHistory);
    res.json(result);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ERROR] /api/gemini/health-assistant: ${errMsg}`);
    res.status(500).json({
      error: "Failed to generate health advice",
      message: "Internal AI server error. Please try again later.",
    });
  }
}

export async function clinicalNotes(req: Request, res: Response): Promise<void> {
  try {
    const { patientName, age, symptoms, vitals, consultationTranscript } = req.body;

    if (!isNonEmptyString(patientName, 200)) {
      res.status(400).json({
        error: "Invalid input",
        message: "'patientName' must be a non-empty string (max 200 chars).",
      });
      return;
    }

    const result = await generateClinicalNotes({
      patientName: sanitize(patientName, 200),
      age: typeof age === "number" && age > 0 && age < 150 ? age : undefined,
      symptoms: isNonEmptyString(symptoms, 5000) ? sanitize(symptoms, 5000) : undefined,
      vitals: isNonEmptyString(vitals, 1000) ? sanitize(vitals, 1000) : undefined,
      consultationTranscript: isNonEmptyString(consultationTranscript, 10000)
        ? sanitize(consultationTranscript, 10000)
        : undefined,
    });

    res.json(result);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ERROR] /api/gemini/clinical-notes: ${errMsg}`);
    res.status(500).json({
      error: "Failed to generate clinical notes",
      message: "Internal AI server error. Please try again later.",
    });
  }
}
