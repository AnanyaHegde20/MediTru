import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3001;

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // AI Health Assistant Endpoint
  app.post("/api/gemini/health-assistant", async (req, res) => {
    try {
      const { message, history = [], reportContext } = req.body;
      const ai = getAI();

      if (!ai) {
        // Fallback intelligent response if API key is not configured in sandbox
        return res.json({
          reply: `Based on your query regarding "${message.slice(0, 45)}...", here is general medical educational context:\n\n` +
            `• **Overview**: Common factors include hydration levels, sleep hygiene, and stress.\n` +
            `• **Recommended Step**: Monitor symptoms for 24-48 hours. If fever >101°F or sharp localized pain occurs, seek medical evaluation.\n` +
            `• **Next Step**: We suggest scheduling a routine follow-up with our General Medicine or Cardiology specialists.`,
          isFallback: true,
          suggestions: ["Schedule consultation with Dr. Alan Stone", "Learn about preventative care"],
        });
      }

      const systemInstruction = `You are "MediTru AI Health Assistant", an empathetic, professional medical SaaS assistant inspired by Apple Health and modern clinical guidelines.
Your duties:
1. Provide accurate, clear, and reassuring health information, explain lab reports (like lipid panels, CBC, metabolic panels), and suggest relevant lifestyle precautions.
2. Structure your answers with clean bullet points, bold key terms, and highlighted precautions.
3. ALWAYS remind users: "I am an AI assistant and not a substitute for a licensed healthcare provider."
4. If symptoms sound severe (e.g. chest pressure, sudden numbness, difficulty breathing), include an explicit emergency advisory tag [URGENT_CARE_RECOMMENDED].
5. Keep your tone calm, trustworthy, and clear.`;

      let prompt = `User query: ${message}\n`;
      if (reportContext) {
        prompt += `\nAttached Lab Report / Clinical Data: ${reportContext}\n`;
      }
      if (history && history.length > 0) {
        prompt += `\nRecent conversation history:\n${history.map((h: any) => `${h.role}: ${h.text}`).join("\n")}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const reply = response.text || "I was unable to generate a clinical response at this moment. Please consult your physician.";
      res.json({ reply, isFallback: false });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        error: "Failed to generate health advice",
        message: error?.message || "Internal AI Server Error",
      });
    }
  });

  // AI Clinical Notes Generator (For Doctors)
  app.post("/api/gemini/clinical-notes", async (req, res) => {
    try {
      const { patientName, age, symptoms, vitals, consultationTranscript } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.json({
          notes: {
            subjective: `Patient ${patientName || "Patient"} presents for follow-up evaluation. Reports persistent symptoms as described.`,
            objective: vitals || "BP: 120/80 mmHg, HR: 72 bpm, SpO2: 98%, Temp: 98.6°F.",
            assessment: "Stable clinical baseline with mild symptom manifestation requiring active monitoring.",
            plan: "1. Continue prescribed medication.\n2. Schedule follow-up in 4 weeks.\n3. Routine blood panel ordered.",
          },
          isFallback: true,
        });
      }

      const prompt = `Generate a structured SOAP (Subjective, Objective, Assessment, Plan) clinical summary for:
Patient: ${patientName || "Jane Doe"}, Age: ${age || "32"}
Vitals: ${vitals || "BP: 124/82, HR: 74, SpO2: 99%"}
Patient Symptoms & Notes: ${symptoms || consultationTranscript || "Routine check-up"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an AI Clinical Scribe for medical professionals. Return a concise, high-standard professional medical SOAP note with clear Subjective, Objective, Assessment, and Plan sections.",
        },
      });

      res.json({ notesText: response.text, isFallback: false });
    } catch (error: any) {
      console.error("Clinical notes error:", error);
      res.status(500).json({ error: error?.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`MediTru backend API running on http://localhost:${PORT}`);
  });
}

startServer();
