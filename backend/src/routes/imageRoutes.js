import express from "express";
import multer from "multer";
import {
  handleGenerateImage,
  handleAnalyzeImage,
  handleAnalyzeImageUrl,
  handleVariations,
} from "../controllers/imageController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

router.post("/generate", handleGenerateImage);
router.post("/analyze", upload.single("image"), handleAnalyzeImage);
router.post("/analyze-url", handleAnalyzeImageUrl);
router.post("/variations", handleVariations);

export default router;
