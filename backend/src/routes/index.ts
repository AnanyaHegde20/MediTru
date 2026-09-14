import { Router } from "express";
import healthRoutes from "./health.routes";
import geminiRoutes from "./gemini.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/gemini", geminiRoutes);

export default router;
