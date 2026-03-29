const BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function readErrorMessage(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      const j = await res.json();
      return j.error || j.message || `Request failed (${res.status})`;
    } catch {
      return `Request failed (${res.status})`;
    }
  }
  const text = await res.text();
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return stripped.slice(0, 280) || `Request failed (${res.status})`;
}

export const analyzePromptAPI = async (prompt) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/text/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new Error(
      "Could not reach the API. Start the backend on port 5000 (or set REACT_APP_API_URL)."
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
};

export const enhanceTextAPI = async (prompt) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/text/enhance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new Error(
      "Could not reach the API. Start the backend on port 5000 and try again."
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error || data.message || `Request failed (${res.status})`
    );
  }
  if (data.error) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Enhance failed."
    );
  }
  return data;
};

export const generateImageAPI = async (prompt) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/image/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new Error(
      "Could not reach the API. Start the backend on port 5000 and try again."
    );
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return res.blob();
};

export const analyzeImageFileAPI = async (file) => {
  const fd = new FormData();
  fd.append("image", file);
  let res;
  try {
    res = await fetch(`${BASE_URL}/image/analyze`, {
      method: "POST",
      body: fd,
    });
  } catch {
    throw new Error("Could not reach the API.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
};

export const analyzeImageUrlAPI = async (url) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/image/analyze-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new Error("Could not reach the API.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
};

export const fetchImageVariationsAPI = async (caption, count = 2) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}/image/variations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, count }),
    });
  } catch {
    throw new Error("Could not reach the API.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
};
