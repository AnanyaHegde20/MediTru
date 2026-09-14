import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// ---------------------------------------------------------------------------
// Input Sanitization
// ---------------------------------------------------------------------------
function sanitize(input: string, maxLength: number): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

// ---------------------------------------------------------------------------
// In-Memory Rate Limiter (100 req / minute per IP)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    });
    return;
  }

  next();
}

// Periodically clean up expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// ---------------------------------------------------------------------------
// Request Logger
// ---------------------------------------------------------------------------
function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
}

// ---------------------------------------------------------------------------
// Gemini AI Client (lazy init)
// ---------------------------------------------------------------------------
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
  }
  return aiClient;
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------
function isNonEmptyString(val: unknown, maxLen: number): val is string {
  return typeof val === "string" && val.trim().length > 0 && val.length <= maxLen;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
async function startServer() {
  const app = express();

  // Trust proxy (for accurate req.ip behind reverse proxies)
  app.set("trust proxy", 1);

  // CORS — restrict to allowed origins
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests with no origin (curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(requestLogger);
  app.use(rateLimit);

  // ---- Health Check ----
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // ---- AI Health Assistant ----
  app.post("/api/gemini/health-assistant", async (req, res) => {
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
      const ai = getAI();

      if (!ai) {
        res.json({
          reply: `Based on your query regarding "${cleanMessage.slice(0, 45)}...", here is general medical educational context:\n\n` +
            `• **Overview**: Common factors include hydration levels, sleep hygiene, and stress.\n` +
            `• **Recommended Step**: Monitor symptoms for 24-48 hours. If fever >101°F or sharp localized pain occurs, seek medical evaluation.\n` +
            `• **Next Step**: We suggest scheduling a routine follow-up with our General Medicine or Cardiology specialists.`,
          isFallback: true,
          suggestions: ["Schedule consultation with Dr. Alan Stone", "Learn about preventative care"],
        });
        return;
      }

      const systemInstruction = `You are "MediTru AI Health Assistant", an empathetic, professional medical SaaS assistant inspired by Apple Health and modern clinical guidelines.
Your duties:
1. Provide accurate, clear, and reassuring health information, explain lab reports (like lipid panels, CBC, metabolic panels), and suggest relevant lifestyle precautions.
2. Structure your answers with clean bullet points, bold key terms, and highlighted precautions.
3. ALWAYS remind users: "I am an AI assistant and not a substitute for a licensed healthcare provider."
4. If symptoms sound severe (e.g. chest pressure, sudden numbness, difficulty breathing), include an explicit emergency advisory tag [URGENT_CARE_RECOMMENDED].
5. Keep your tone calm, trustworthy, and clear.`;

      let prompt = `User query: ${cleanMessage}\n`;
      if (reportContext && typeof reportContext === "string") {
        prompt += `\nAttached Lab Report / Clinical Data: ${sanitize(reportContext, 10000)}\n`;
      }
      if (Array.isArray(history) && history.length > 0) {
        const sanitizedHistory = history
          .slice(-10)
          .map((h: { role?: string; text?: string }) => {
            const role = typeof h.role === "string" ? sanitize(h.role, 50) : "unknown";
            const text = typeof h.text === "string" ? sanitize(h.text, 2000) : "";
            return `${role}: ${text}`;
          })
          .join("\n");
        prompt += `\nRecent conversation history:\n${sanitizedHistory}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const reply =
        response.text ||
        "I was unable to generate a clinical response at this moment. Please consult your physician.";
      res.json({ reply, isFallback: false });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[ERROR] /api/gemini/health-assistant: ${errMsg}`);
      res.status(500).json({
        error: "Failed to generate health advice",
        message: "Internal AI server error. Please try again later.",
      });
    }
  });

  // ---- AI Clinical Notes Generator ----
  app.post("/api/gemini/clinical-notes", async (req, res) => {
    try {
      const { patientName, age, symptoms, vitals, consultationTranscript } = req.body;

      if (!isNonEmptyString(patientName, 200)) {
        res.status(400).json({
          error: "Invalid input",
          message: "'patientName' must be a non-empty string (max 200 chars).",
        });
        return;
      }

      const cleanName = sanitize(patientName, 200);
      const cleanSymptoms = isNonEmptyString(symptoms, 5000) ? sanitize(symptoms, 5000) : "";
      const cleanVitals = isNonEmptyString(vitals, 1000) ? sanitize(vitals, 1000) : "";
      const cleanTranscript = isNonEmptyString(consultationTranscript, 10000)
        ? sanitize(consultationTranscript, 10000)
        : "";
      const cleanAge = typeof age === "number" && age > 0 && age < 150 ? age : undefined;

      const ai = getAI();

      if (!ai) {
        res.json({
          notes: {
            subjective: `Patient ${cleanName} presents for follow-up evaluation. Reports persistent symptoms as described.`,
            objective: cleanVitals || "BP: 120/80 mmHg, HR: 72 bpm, SpO2: 98%, Temp: 98.6°F.",
            assessment: "Stable clinical baseline with mild symptom manifestation requiring active monitoring.",
            plan: "1. Continue prescribed medication.\n2. Schedule follow-up in 4 weeks.\n3. Routine blood panel ordered.",
          },
          isFallback: true,
        });
        return;
      }

      const prompt = `Generate a structured SOAP (Subjective, Objective, Assessment, Plan) clinical summary for:
Patient: ${cleanName}, Age: ${cleanAge || "N/A"}
Vitals: ${cleanVitals || "BP: 124/82, HR: 74, SpO2: 99%"}
Patient Symptoms & Notes: ${cleanSymptoms || cleanTranscript || "Routine check-up"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are an AI Clinical Scribe for medical professionals. Return a concise, high-standard professional medical SOAP note with clear Subjective, Objective, Assessment, and Plan sections.",
        },
      });

      res.json({ notesText: response.text, isFallback: false });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[ERROR] /api/gemini/clinical-notes: ${errMsg}`);
      res.status(500).json({
        error: "Failed to generate clinical notes",
        message: "Internal AI server error. Please try again later.",
      });
    }
  });

  // ---- Global Error Handler ----
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(`[FATAL] ${err.message}`);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred.",
    });
  });

  app.listen(PORT, () => {
    console.log(`[MediTru] Backend API running on http://localhost:${PORT}`);
    console.log(`[MediTru] CORS allowed origins: ${allowedOrigins.join(", ")}`);
  });
}

startServer();
