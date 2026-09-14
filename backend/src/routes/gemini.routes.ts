import { Router } from "express";
import { healthAssistant, clinicalNotes } from "../controllers/gemini.controller";

const router = Router();

router.post("/health-assistant", healthAssistant);
router.post("/clinical-notes", clinicalNotes);

export default router;
