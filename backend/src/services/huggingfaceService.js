import { InferenceClient } from "@huggingface/inference";
import {
  HF_API_KEY,
  HF_TEXT_MODEL,
  HF_CAPTION_MODEL,
  IMAGE_GEN_BACKEND,
  HF_IMAGE_MODEL,
  HF_IMAGE_PROVIDER,
} from "../config/env.js";
import {
  fetchPollinationsImage,
  buildVariationPrompts,
  pollinationsImageUrl,
} from "./pollinationsService.js";

const CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

function requireKey() {
  const key = HF_API_KEY;
  if (!key) {
    const err = new Error(
      "Missing HF_API_KEY. Create a User Access Token at https://huggingface.co/settings/tokens (starts with hf_). It is NOT your Hugging Face login password."
    );
    err.statusCode = 503;
    throw err;
  }
  return key;
}

function mapInferenceError(err) {
  const status = err?.httpResponse?.status;
  if (typeof status === "number" && status >= 400 && status < 600) {
    err.statusCode = status;
  } else if (!err.statusCode) {
    err.statusCode = 502;
  }
  return err;
}

async function chatCompletionJson(messages, max_tokens = 400) {
  const key = requireKey();
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HF_TEXT_MODEL,
      messages,
      max_tokens,
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let msg = raw;
    try {
      const j = JSON.parse(raw);
      msg =
        (typeof j.error === "string" && j.error) ||
        j.error?.message ||
        j.message ||
        raw;
    } catch {
      
    }
    const err = new Error(
      typeof msg === "string" ? msg : `Request failed (${res.status})`
    );
    err.statusCode = res.status >= 400 && res.status < 600 ? res.status : 502;
    throw err;
  }
  const data = JSON.parse(raw);
  return data?.choices?.[0]?.message?.content?.trim?.() ?? "";
}

function tryParseJsonObject(text) {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}


export const analyzePromptNLP = async (prompt) => {
  const text = prompt?.trim() ?? "";
  if (!text) {
    return {
      tone: "",
      intent: "",
      keywords: [],
      summary: "",
    };
  }

  if (!HF_API_KEY) {
    const words = text.split(/\s+/).filter(Boolean).slice(0, 10);
    return {
      tone: "not analyzed (no API key)",
      intent: "creative image generation",
      keywords: words.length ? words : ["prompt"],
      summary: text.slice(0, 240),
      needsApiKey: true,
      hint: "Set HF_API_KEY in backend/.env for full NLP via Hugging Face Inference Providers.",
    };
  }

  const content = await chatCompletionJson(
    [
      {
        role: "user",
        content:
          "Analyze this text for an AI image-generation tool. Reply with ONLY valid JSON (no markdown fences) using keys: tone (string), intent (string), keywords (array of 4-8 short strings), summary (one sentence).\n\nText:\n" +
          text.slice(0, 2000),
      },
    ],
    400
  );

  const parsed = tryParseJsonObject(content);
  if (parsed && typeof parsed === "object") {
    return {
      tone: String(parsed.tone ?? ""),
      intent: String(parsed.intent ?? ""),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
      summary: String(parsed.summary ?? ""),
    };
  }

  return {
    tone: "—",
    intent: "—",
    keywords: [],
    summary: content.slice(0, 500),
  };
};

export const enhanceText = async (prompt) => {
  const text = prompt?.trim() ?? "";
  if (!text) {
    return [{ generated_text: "" }];
  }

  if (!HF_API_KEY) {
    return [
      {
        generated_text: text,
        note: "Pass-through (no HF_API_KEY). Add a Hugging Face User Access Token for AI-enhanced prompts.",
      },
    ];
  }

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HF_TEXT_MODEL,
      messages: [
        {
          role: "user",
          content:
            "Improve the following so it works well as a detailed AI image-generation prompt. " +
            "Reply with ONLY the improved prompt in English — no quotes, no headings, no explanation:\n\n" +
            text,
        },
      ],
      max_tokens: 256,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    let msg = raw;
    try {
      const j = JSON.parse(raw);
      msg =
        (typeof j.error === "string" && j.error) ||
        j.error?.message ||
        j.message ||
        j.detail ||
        raw;
    } catch {
      /* keep */
    }
    const err = new Error(
      typeof msg === "string" ? msg : `Chat completion failed (${res.status})`
    );
    err.statusCode = res.status >= 400 && res.status < 600 ? res.status : 502;
    throw err;
  }

  const data = JSON.parse(raw);
  const improved = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
  return [{ generated_text: improved }];
};

export const generateImage = async (prompt) => {
  const text = prompt?.trim() ?? "";
  if (!text) {
    const err = new Error("Prompt is required.");
    err.statusCode = 400;
    throw err;
  }

  if (IMAGE_GEN_BACKEND === "pollinations") {
    return fetchPollinationsImage(text);
  }

  requireKey();
  const client = new InferenceClient(HF_API_KEY);
  try {
    const blob = await client.textToImage({
      model: HF_IMAGE_MODEL,
      inputs: text,
      provider: HF_IMAGE_PROVIDER,
    });
    return Buffer.from(await blob.arrayBuffer());
  } catch (err) {
    mapInferenceError(err);
    throw err;
  }
};

export async function captionImageBuffer(buffer, mimeType = "image/jpeg") {
  requireKey();
  const client = new InferenceClient(HF_API_KEY);
  const blob = new Blob([buffer], { type: mimeType });
  const out = await client.imageToText({
    model: HF_CAPTION_MODEL,
    inputs: blob,
  });
  return out.generated_text;
}

async function enrichCaptionStructured(caption) {
  const content = await chatCompletionJson(
    [
      {
        role: "user",
        content:
          'Given this image description, reply with ONLY JSON (no markdown) with keys: style (string), mood (string), objects (array of short object names), keywords (array of 4-8 tags).\n\nDescription: "' +
          caption.slice(0, 1500) +
          '"',
      },
    ],
    350
  );
  const parsed = tryParseJsonObject(content);
  if (parsed && typeof parsed === "object") {
    return {
      style: String(parsed.style ?? "—"),
      mood: String(parsed.mood ?? "—"),
      objects: Array.isArray(parsed.objects) ? parsed.objects.map(String) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
    };
  }
  return { style: "—", mood: "—", objects: [], keywords: [] };
}

export async function analyzeImageFull(buffer, mimeType) {
  let caption = "";
  let style = "—";
  let mood = "—";
  let objects = [];
  let keywords = [];

  if (!HF_API_KEY) {
    return {
      caption: "",
      style,
      mood,
      objects,
      keywords,
      needsApiKey: true,
      hint:
        "Add HF_API_KEY (User Access Token hf_...) to backend/.env for BLIP captioning and structured analysis. Image generation can still use Pollinations without it.",
    };
  }

  try {
    caption = await captionImageBuffer(buffer, mimeType);
  } catch (e) {
    console.warn("[caption]", e?.message || e);
    caption = "";
  }

  if (caption) {
    try {
      const enriched = await enrichCaptionStructured(caption);
      style = enriched.style;
      mood = enriched.mood;
      objects = enriched.objects;
      keywords = enriched.keywords;
    } catch (e) {
      console.warn("[enrich]", e?.message || e);
    }
  }

  return {
    caption: caption || "—",
    style,
    mood,
    objects,
    keywords,
    needsApiKey: false,
  };
}

export function getVariationPlan(caption, count = 2) {
  return buildVariationPrompts(caption, count).map((p) => ({
    prompt: p.prompt,
    seed: p.seed,
    url: pollinationsImageUrl(p.prompt, { seed: p.seed }),
  }));
}
