import { useState, useEffect } from "react";
import Card from "../common/Card";
import {
  analyzePromptAPI,
  enhanceTextAPI,
  generateImageAPI,
} from "../../services/api";
import Button from "../common/Button";

function TextToImage() {
  const [prompt, setPrompt] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [enhanced, setEnhanced] = useState("");
  const [approved, setApproved] = useState(false);
  const [image, setImage] = useState(null);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingEnhance, setLoadingEnhance] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [error, setError] = useState("");

  const runAnalyze = async () => {
    setError("");
    if (!prompt.trim()) {
      setError("Enter a prompt first.");
      return;
    }
    setLoadingAnalyze(true);
    setAnalysis(null);
    try {
      const data = await analyzePromptAPI(prompt);
      setAnalysis(data);
    } catch (e) {
      setError(e?.message || "Analysis failed.");
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const runEnhance = async () => {
    setError("");
    if (!prompt.trim()) {
      setError("Enter a prompt first.");
      return;
    }
    setApproved(false);
    setLoadingEnhance(true);
    try {
      const data = await enhanceTextAPI(prompt);
      const item = Array.isArray(data) ? data[0] : data;
      setEnhanced(item?.generated_text ?? "");
    } catch (e) {
      setError(e?.message || "Enhance failed.");
      setEnhanced("");
    } finally {
      setLoadingEnhance(false);
    }
  };

  const generate = async () => {
    setError("");
    if (!approved) {
      setError('Check the box to approve the enhanced prompt before generating.');
      return;
    }
    if (!enhanced.trim()) {
      setError("Run “Enhance prompt” first (or paste text in the enhanced field).");
      return;
    }
    setLoadingGen(true);
    try {
      const blob = await generateImageAPI(enhanced);
      if (image) URL.revokeObjectURL(image);
      setImage(URL.createObjectURL(blob));
    } catch (e) {
      setError(e?.message || "Image generation failed.");
    } finally {
      setLoadingGen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  return (
    <Card>
      <h2>
        <span className="emoji" aria-hidden="true">
          ✨
        </span>
        Text workflow
      </h2>
      <p className="card-lead">
        NLP analysis → enhance prompt → approve → generate image (assignment
        flow).
      </p>
      <div className="workflow-steps" aria-label="Steps">
        <span>1 · Analyze</span>
        <span>2 · Enhance</span>
        <span>3 · Approve</span>
        <span>4 · Generate</span>
      </div>
      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      <label className="field-label" htmlFor="prompt-input">
        Your prompt
      </label>
      <textarea
        id="prompt-input"
        className="input-field"
        placeholder="e.g. cozy coffee shop at golden hour, warm light, film grain…"
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setApproved(false);
        }}
        rows={3}
      />

      <div className="btn-row">
        <Button
          text="1 · Analyze (NLP)"
          onClick={runAnalyze}
          loading={loadingAnalyze}
        />
        <Button
          text="2 · Enhance prompt"
          onClick={runEnhance}
          loading={loadingEnhance}
          disabled={loadingAnalyze}
        />
      </div>

      {analysis ? (
        <div className="analysis-panel">
          <dl>
            <dt>Tone</dt>
            <dd>{analysis.tone || "—"}</dd>
            <dt>Intent</dt>
            <dd>{analysis.intent || "—"}</dd>
            <dt>Summary</dt>
            <dd>{analysis.summary || "—"}</dd>
            <dt>Keywords</dt>
            <dd>
              <div className="keyword-row">
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

      <label className="field-label" htmlFor="enhanced-output">
        Enhanced prompt (edit before approval)
      </label>
      <textarea
        id="enhanced-output"
        className="input-field"
        placeholder="Run “Enhance prompt” — or type your own final prompt here."
        value={enhanced}
        onChange={(e) => {
          setEnhanced(e.target.value);
          setApproved(false);
        }}
        rows={4}
      />

      <label className="approve-row">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        <span>
          I approve this text for image generation (step 3 — required before
          generate).
        </span>
      </label>

      <div className="btn-row">
        <Button
          text="4 · Generate image"
          onClick={generate}
          loading={loadingGen}
          disabled={loadingEnhance || loadingAnalyze}
        />
      </div>
      <p className="hint-inline">
        Image generation uses Pollinations by default (no extra signup). Add{" "}
        <code>HF_API_KEY</code> for Hugging Face NLP + optional HF image
        backends.
      </p>

      <div className="preview-frame">
        {image ? (
          <img src={image} alt="AI generated result" />
        ) : (
          <p className="preview-placeholder">
            Generated image appears here after approval.
          </p>
        )}
      </div>
    </Card>
  );
}

export default TextToImage;
