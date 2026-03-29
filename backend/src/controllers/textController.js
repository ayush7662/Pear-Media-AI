import { enhanceText, analyzePromptNLP } from "../services/huggingfaceService.js";

function safeMessage(err) {
  if (!err?.message) return "Request failed.";
  return String(err.message).replace(/^Upstream error:\s*/i, "");
}

export const handleAnalyzePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await analyzePromptNLP(prompt);
    res.json(data);
  } catch (err) {
    const status = err.statusCode ?? 502;
    console.error("[analyze]", err?.message || err);
    res.status(status).json({ error: safeMessage(err) });
  }
};

export const handleEnhanceText = async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await enhanceText(prompt);
    res.json(data);
  } catch (err) {
    const status = err.statusCode ?? 502;
    console.error("[enhance]", err?.message || err);
    res.status(status).json({ error: safeMessage(err) });
  }
};
