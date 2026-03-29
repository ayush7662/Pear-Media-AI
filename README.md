# Pear Media — Webpage for Image & Text Generation

Assignment prototype: **text workflow** (NLP analysis → prompt enhance → approval → image) and **image workflow** (upload or URL → caption & tags → similar variations).

## Features

| Workflow | Steps | APIs |
|----------|--------|------|
| **Text** | Analyze tone/intent/keywords → Enhance prompt → Checkbox approval → Generate | Hugging Face `router.huggingface.co/v1/chat/completions`; image gen defaults to **Pollinations** (no key) |
| **Image** | Upload file **or** paste `https` image URL → Analyze → Variations | BLIP caption + chat enrichment (needs `HF_API_KEY`); variations via **Pollinations** |

## Quick start (local)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — see below
npm install
node server.js
```

Server listens on **port 5000** (or `process.env.PORT`).

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

CRA runs on **port 3000**. The app calls `http://localhost:5000/api` unless you set:

```env
# frontend/.env
REACT_APP_API_URL=https://your-api-host.com/api
```

### 3. Hugging Face token (`backend/.env`)

- Create a **User Access Token** at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) — it must start with **`hf_`** (this is **not** your Hugging Face login password).
- Enable permissions for **Inference** / **Inference Providers** as required by your account.

```env
HF_API_KEY=hf_xxxxxxxx

# Optional — defaults are sensible
HF_TEXT_MODEL=Qwen/Qwen2.5-1.5B-Instruct:fastest
HF_CAPTION_MODEL=Salesforce/blip-image-captioning-base

# Image generation: pollinations (default, free, no extra auth) | hf
IMAGE_GEN_BACKEND=pollinations

# Only if IMAGE_GEN_BACKEND=hf
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
HF_IMAGE_PROVIDER=fal-ai
```

**Without `HF_API_KEY`:** NLP analysis is a light keyword split; enhance passes text through; image **captioning** is skipped (variations still work from placeholder captions). **Image generation** still works via Pollinations.

## API routes (backend)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/text/analyze` | `{ prompt }` | JSON: tone, intent, keywords, summary |
| POST | `/api/text/enhance` | `{ prompt }` | `[{ generated_text }]` |
| POST | `/api/image/generate` | `{ prompt }` | Raw image bytes |
| POST | `/api/image/analyze` | `multipart/form-data` field `image` | Caption + tags |
| POST | `/api/image/analyze-url` | `{ url }` | Same JSON + `sourceUrl` |
| POST | `/api/image/variations` | `{ caption, count }` | `{ variations: [{ prompt, seed, url }] }` |

## Hosting

- **Frontend:** build with `npm run build`, deploy `frontend/build` to **Netlify** or **Vercel**.
- **Backend:** deploy to **Render**, **Railway**, **Fly.io**, etc. Set env vars and `REACT_APP_API_URL` to your API base.

## Deliverables checklist

- [ ] Working hosted link (frontend + API URL configured)
- [ ] GitHub repository with this README
- [ ] Short demo video (text + image flows, APIs in action)

## Project structure

```
backend/   Express, Hugging Face router, Pollinations, multer uploads
frontend/  React (CRA), theme toggle, two workflow cards
```

## Troubleshooting

- **“Invalid username or password”** from Hugging Face: wrong token — use `hf_…` User Access Token, not account password.
- **Fal / flux auth errors:** keep `IMAGE_GEN_BACKEND=pollinations` for demos without Fal billing.
- **CORS:** backend enables `cors()` for all origins in development; tighten for production.
