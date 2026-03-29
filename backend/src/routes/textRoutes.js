import express from "express";
import {
  handleEnhanceText,
  handleAnalyzePrompt,
} from "../controllers/textController.js";

const router = express.Router();

router.post("/analyze", handleAnalyzePrompt);
router.post("/enhance", handleEnhanceText);

export default router;
