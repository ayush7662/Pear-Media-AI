import dotenv from "dotenv";

dotenv.config();


export const HF_API_KEY = process.env.HF_API_KEY?.trim();


export const HF_TEXT_MODEL =
  process.env.HF_TEXT_MODEL || "Qwen/Qwen2.5-1.5B-Instruct:fastest";


export const HF_CAPTION_MODEL =
  process.env.HF_CAPTION_MODEL || "Salesforce/blip-image-captioning-base";


export const IMAGE_GEN_BACKEND = (process.env.IMAGE_GEN_BACKEND || "pollinations")
  .toLowerCase()
  .trim();

export const HF_IMAGE_MODEL =
  process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

export const HF_IMAGE_PROVIDER = process.env.HF_IMAGE_PROVIDER || "fal-ai";
