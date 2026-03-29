/**
 * Pollinations — free text-to-image HTTP API (no API key).
 * Good for reliable assignment demos when HF image providers need extra auth.
 */

const MAX_LEN = 1800;

export function pollinationsImageUrl(prompt, { seed, width = 768, height = 768 } = {}) {
  const text = String(prompt).slice(0, MAX_LEN);
  const encoded = encodeURIComponent(text);
  const s = seed ?? Math.floor(Math.random() * 2_147_483_647);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&nologo=true`;
}

export async function fetchPollinationsImage(prompt, options = {}) {
  const url = pollinationsImageUrl(prompt, options);
  const ms = Number(process.env.POLLINATIONS_TIMEOUT_MS) || 120000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  let res;
  try {
    res = await fetch(url, { signal: ctrl.signal });
  } catch (e) {
    clearTimeout(timer);
    const name = e?.name || "";
    const msg =
      name === "AbortError"
        ? `Pollinations timed out after ${ms / 1000}s. Try a shorter prompt, check internet, or use VPN if image.pollinations.ai is blocked.`
        : e?.message?.includes("fetch failed") || e?.code === "UND_ERR_CONNECT_TIMEOUT"
          ? "Could not reach Pollinations (network/firewall). Try another network or VPN."
          : e?.message || "Pollinations request failed";
    const err = new Error(msg);
    err.statusCode = 502;
    throw err;
  }
  clearTimeout(timer);
  if (!res.ok) {
    const err = new Error(`Pollinations returned HTTP ${res.status}`);
    err.statusCode = 502;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

export function buildVariationPrompts(caption, count = 2) {
  const base = caption?.trim() || "artistic scene, high detail";
  const seeds = [101, 202].slice(0, count);
  return seeds.map((seed, i) => ({
    seed,
    prompt: `${base}, variation ${i + 1}, similar theme, professional photography, sharp focus`,
  }));
}
