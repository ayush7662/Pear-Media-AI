import {
  generateImage,
  analyzeImageFull,
  getVariationPlan,
} from "../services/huggingfaceService.js";

function safeMessage(err) {
  if (!err?.message) return "Image operation failed.";
  return String(err.message).replace(/^Upstream error:\s*/i, "");
}

function isSafeImageUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local")) return false;
    if (h === "0.0.0.0") return false;
    if (h.startsWith("127.")) return false;
    if (h.startsWith("10.")) return false;
    if (h.startsWith("192.168.")) return false;
    if (h.startsWith("172.")) {
      const p = parseInt(h.split(".")[1], 10);
      if (p >= 16 && p <= 31) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const handleGenerateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const img = await generateImage(prompt);
    res.set("Content-Type", "image/png");
    res.send(img);
  } catch (err) {
    const status = err.statusCode ?? 502;
    console.error("[image]", err?.message || err);
    res.status(status).json({ error: safeMessage(err) });
  }
};

export const handleAnalyzeImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({ error: "Missing image file (field name: image)." });
    }
    const mime = file.mimetype || "image/jpeg";
    const data = await analyzeImageFull(file.buffer, mime);
    res.json(data);
  } catch (err) {
    const status = err.statusCode ?? 502;
    console.error("[analyze-image]", err?.message || err);
    res.status(status).json({ error: safeMessage(err) });
  }
};

export const handleAnalyzeImageUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "JSON body must include { url: \"https://...\" }" });
    }
    if (!isSafeImageUrl(url)) {
      return res.status(400).json({
        error:
          "Only safe https image URLs are allowed (not localhost or private networks).",
      });
    }
    const imgRes = await fetch(url, {
      redirect: "follow",
      headers: { Accept: "image/*" },
    });
    if (!imgRes.ok) {
      return res.status(400).json({ error: `Could not fetch URL (HTTP ${imgRes.status})` });
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) {
      return res.status(400).json({ error: "URL did not return an image content-type." });
    }
    if (buf.length > 6 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large (max ~6MB)." });
    }
    const data = await analyzeImageFull(buf, ct);
    res.json({ ...data, sourceUrl: url });
  } catch (err) {
    const status = err.statusCode ?? 502;
    console.error("[analyze-url]", err?.message || err);
    res.status(status).json({ error: safeMessage(err) });
  }
};

export const handleVariations = async (req, res) => {
  try {
    const { caption, count = 2 } = req.body;
    const n = Math.min(Math.max(Number(count) || 2, 1), 4);
    const variations = getVariationPlan(
      typeof caption === "string" ? caption : "",
      n
    );
    res.json({ variations });
  } catch (err) {
    console.error("[variations]", err?.message || err);
    res.status(500).json({ error: safeMessage(err) });
  }
};
