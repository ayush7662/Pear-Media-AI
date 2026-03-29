import { useState, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import {
  analyzeImageFileAPI,
  analyzeImageUrlAPI,
  fetchImageVariationsAPI,
} from "../../services/api";

function ImageUpload() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingVar, setLoadingVar] = useState(false);
  const [variations, setVariations] = useState([]);
  const [varPrompt, setVarPrompt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const runAnalyzeFile = async () => {
    setError("");
    if (!file) {
      setError("Choose an image file first.");
      return;
    }
    setLoadingAnalyze(true);
    setAnalysis(null);
    setVariations([]);
    try {
      const data = await analyzeImageFileAPI(file);
      setAnalysis(data);
      if (data.caption && data.caption !== "—") {
        setVarPrompt(data.caption);
      }
    } catch (e) {
      setError(e?.message || "Analysis failed.");
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const runAnalyzeUrl = async () => {
    setError("");
    const u = remoteUrl.trim();
    if (!u) {
      setError("Paste an https image URL.");
      return;
    }
    setLoadingAnalyze(true);
    setAnalysis(null);
    setVariations([]);
    setFile(null);
    try {
      const data = await analyzeImageUrlAPI(u);
      setAnalysis(data);
      if (data.caption && data.caption !== "—") {
        setVarPrompt(data.caption);
      }
    } catch (e) {
      setError(e?.message || "Could not analyze URL.");
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const runVariations = async () => {
    setError("");
    const caption = (varPrompt || analysis?.caption || "").trim();
    if (!caption || caption === "—") {
      setError(
        "Enter a variation prompt below, or run analysis with HF_API_KEY for auto-caption."
      );
      return;
    }
    setLoadingVar(true);
    setVariations([]);
    try {
      const data = await fetchImageVariationsAPI(caption, 2);
      setVariations(data.variations || []);
    } catch (e) {
      setError(e?.message || "Variations failed.");
    } finally {
      setLoadingVar(false);
    }
  };

  return (
    <Card>
      <h2>
        <span className="emoji" aria-hidden="true">
          🖼️
        </span>
        Image workflow
      </h2>
      <p className="card-lead">
        Upload or paste an image URL → AI caption &amp; tags (with HF key) →
        similar variations (Pollinations).
      </p>
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      <label className="field-label" htmlFor="image-url">
        Or load from URL (https only)
      </label>
      <div className="url-row">
        <input
          id="image-url"
          className="input-field"
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={remoteUrl}
          onChange={(e) => setRemoteUrl(e.target.value)}
        />
        <button
          type="button"
          className="secondary-btn"
          onClick={runAnalyzeUrl}
          disabled={loadingAnalyze}
        >
          Analyze URL
        </button>
      </div>

      <p className="field-label">Upload from device</p>
      <div className="upload-zone">
        <span className="file-label">Choose image</span>
        <p className="upload-hint">PNG, JPG, WebP — max ~6MB</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setAnalysis(null);
            setVariations([]);
          }}
        />
      </div>

      <div className="preview-frame preview-frame--upload">
        {previewUrl ? (
          <img src={previewUrl} alt="Upload preview" />
        ) : analysis?.sourceUrl ? (
          <img src={analysis.sourceUrl} alt="Remote preview" />
        ) : (
          <p className="preview-placeholder">
            Preview after upload or successful URL analysis.
          </p>
        )}
      </div>

      <div className="btn-row">
        <Button
          text="Analyze image (caption &amp; tags)"
          onClick={runAnalyzeFile}
          loading={loadingAnalyze}
          disabled={!file}
        />
      </div>

      {analysis ? (
        <div className="analysis-panel">
          <dl>
            <dt>Caption</dt>
            <dd>{analysis.caption}</dd>
            <dt>Style / mood</dt>
            <dd>
              {analysis.style} · {analysis.mood}
            </dd>
            <dt>Objects / keywords</dt>
            <dd>
              <div className="keyword-row">
                {(analysis.objects || []).map((o) => (
                  <span key={o} className="keyword-pill">
                    {o}
                  </span>
                ))}
                {(analysis.keywords || []).map((k) => (
                  <span key={k} className="keyword-pill">
                    {k}
                  </span>
                ))}
              </div>
            </dd>
          </dl>
          {analysis.hint ? (
            <p className="hint-inline">{analysis.hint}</p>
          ) : null}
        </div>
      ) : null}

      <label className="field-label" htmlFor="var-prompt">
        Variation prompt (similar new images)
      </label>
      <textarea
        id="var-prompt"
        className="input-field"
        rows={2}
        placeholder="Filled from analysis when available — or describe the scene yourself."
        value={varPrompt}
        onChange={(e) => setVarPrompt(e.target.value)}
      />

      <div className="btn-row">
        <Button
          text="Generate similar variations"
          onClick={runVariations}
          loading={loadingVar}
          disabled={loadingAnalyze}
        />
      </div>
      <p className="hint-inline">
        Variations use Pollinations (free). Captions need{" "}
        <code>HF_API_KEY</code> + Inference access on the backend.
      </p>

      {variations.length > 0 ? (
        <div className="variation-grid">
          {variations.map((v, i) => (
            <figure key={i} className="variation-tile">
              <img src={v.url} alt={`Variation ${i + 1}`} loading="lazy" />
            </figure>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export default ImageUpload;
