import express from "express";
import cors from "cors";
import { config } from "./config";
import { requestLogger } from "./middleware/requestLogger";
import { rateLimit } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import apiRoutes from "./routes";

async function startServer() {
  const app = express();

  // Trust proxy (for accurate req.ip behind reverse proxies)
  app.set("trust proxy", 1);

  // CORS — restrict to allowed origins
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes(origin)) {
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

  // Mount all API routes under /api
  app.use("/api", apiRoutes);

  // Global error handler
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`[MediTru] Backend API running on http://localhost:${config.port}`);
    console.log(`[MediTru] CORS allowed origins: ${config.allowedOrigins.join(", ")}`);
  });
}

startServer();
