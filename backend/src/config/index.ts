import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim()),
};
