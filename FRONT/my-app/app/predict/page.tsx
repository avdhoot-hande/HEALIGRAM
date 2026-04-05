"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import PredictionForm from "@/components/prediction-form";
import NearbyHospitals from "@/components/nearby-hospitals";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface PredictResult {
  prediction: number;
  confidence: number;
  rf_confidence?: number;
  xgb_confidence?: number;
  ecg_confidence?: number | null;
  risk_factors?: string[];
  critical_factors?: string[];
  moderate_factors?: string[];
  lifestyle_factors?: string[];
  // ECG-only fields (when only ECG is submitted via /predict-ecg)
  label?: string;
  probabilities?: { normal: number; mi: number; abnormal: number };
}

type InputMode = "biometrics" | "ecg" | "both";
type ResultTab = "overview" | "breakdown" | "factors";

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const ECG_LABELS: Record<number, { label: string; color: string; bg: string; border: string; dot: string; risk: string; desc: string }> = {
  0: {
    label: "Normal ECG", color: "text-emerald-400", bg: "bg-emerald-500/10",
    border: "border-emerald-500/30", dot: "bg-emerald-400", risk: "Low Risk",
    desc: "No significant abnormalities detected. All waveform morphology is within normal clinical parameters.",
  },
  1: {
    label: "Myocardial Infarction", color: "text-red-400", bg: "bg-red-500/10",
    border: "border-red-500/30", dot: "bg-red-400", risk: "High Risk",
    desc: "Signs of myocardial infarction detected. ST-segment changes indicate a possible ischemic event. Seek immediate care.",
  },
  2: {
    label: "Abnormal Heartbeat", color: "text-amber-400", bg: "bg-amber-500/10",
    border: "border-amber-500/30", dot: "bg-amber-400", risk: "Moderate Risk",
    desc: "Irregular heartbeat pattern detected. Waveform deviates from normal sinus parameters. Cardiology assessment advised.",
  },
};

const HISTORY_KEY = "healigram_combined_history";

function loadHistory(): Array<{ result: PredictResult; mode: InputMode; ts: string }> {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(h: ReturnType<typeof loadHistory>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20)));
}

// ─────────────────────────────────────────────────────────────────
// SMALL UI HELPERS
// ─────────────────────────────────────────────────────────────────

function ProbBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), delay + 150);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${color}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color.replace("text-", "bg-")}`}
          style={{ width: `${w}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function ModeChip({ mode }: { mode: InputMode }) {
  const map = {
    biometrics: { label: "Biometrics only", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/25" },
    ecg:        { label: "ECG only",         color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/25" },
    both:       { label: "Biometrics + ECG", color: "text-primary",   bg: "bg-primary/10 border-primary/25" },
  }[mode];
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map.bg} ${map.color}`}>
      {map.label}
    </span>
  );
}

function ConfidenceRing({ pct, color }: { pct: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDash((pct / 100) * circ), 300);
    return () => clearTimeout(t);
  }, [pct, circ]);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
      <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke="currentColor" strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - dash}
        className={`${color} transition-all duration-1000 ease-out`}
        style={{ transitionDelay: "200ms" }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3-TIER RISK HELPER
// Model is bimodal — outputs cluster near 0–20% or 80–99%.
// prediction=0               → LOW
// prediction=1 + conf < 85   → MODERATE
// prediction=1 + conf ≥ 85   → HIGH
// ─────────────────────────────────────────────────────────────────

type RiskTier = "low" | "moderate" | "high";

function getRiskTier(prediction: number, conf: number): RiskTier {
  if (prediction === 0) return "low";
  return conf >= 85 ? "high" : "moderate";
}

const RISK_TIER_META: Record<RiskTier, {
  label: string;
  sublabel: string;
  color: string;
  ringColor: string;
  bg: string;
  border: string;
  badge: string;
  badgeBg: string;
  icon: string;
  advice: string;
}> = {
  low: {
    label: "Low Risk",
    sublabel: "No significant CAD indicators detected",
    color: "text-emerald-400",
    ringColor: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    badge: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/25",
    icon: "✦",
    advice: "Maintain a healthy lifestyle. Routine annual checkups are recommended.",
  },
  moderate: {
    label: "Moderate Risk",
    sublabel: "Some risk indicators present — monitoring advised",
    color: "text-amber-400",
    ringColor: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    badge: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/25",
    icon: "◈",
    advice: "Consider lifestyle improvements and consult a doctor for a full cardiac workup.",
  },
  high: {
    label: "High Risk",
    sublabel: "Strong CAD risk indicators detected",
    color: "text-red-400",
    ringColor: "text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    badge: "text-red-400",
    badgeBg: "bg-red-500/10 border-red-500/25",
    icon: "⚠",
    advice: "Seek prompt medical evaluation. Immediate cardiology consultation is strongly recommended.",
  },
};

// Animated 3-segment tier bar
function TierBar({ tier }: { tier: RiskTier }) {
  const [filled, setFilled] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFilled(true), 400); return () => clearTimeout(t); }, []);

  const segments = [
    { key: "low",      label: "Low",      active: ["low","moderate","high"].includes(tier), color: "bg-emerald-500" },
    { key: "moderate", label: "Moderate", active: ["moderate","high"].includes(tier),        color: "bg-amber-500" },
    { key: "high",     label: "High",     active: tier === "high",                           color: "bg-red-500" },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {segments.map((s) => (
          <div key={s.key} className="flex-1 space-y-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${s.active && filled ? s.color : "bg-transparent"}`}
                style={{ width: s.active && filled ? "100%" : "0%", transitionDelay: s.key === "low" ? "0ms" : s.key === "moderate" ? "150ms" : "300ms" }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground/50 text-center uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RESULT DISPLAY
// ─────────────────────────────────────────────────────────────────

function ResultDisplay({ result, mode }: { result: PredictResult; mode: InputMode }) {
  const [tab, setTab] = useState<ResultTab>("overview");

  const conf = result.confidence;
  const isCombinedOrBio = mode === "biometrics" || mode === "both";

  // For prediction=0 (Low Risk), raw confidence is the CAD probability (e.g. 14%).
  // We flip it so the ring shows "healthy confidence" (86%) instead.
  // For prediction=1, confidence is already the CAD risk score — show as-is.
  const displayConf = isCombinedOrBio && result.prediction === 0
    ? 100 - conf
    : conf;

  // ── 3-tier logic (biometrics / both) ──
  const tier = isCombinedOrBio ? getRiskTier(result.prediction, conf) : null;
  const tierMeta = tier ? RISK_TIER_META[tier] : null;

  // ── ECG-only label ──
  const ecgMeta = !isCombinedOrBio ? (ECG_LABELS[result.prediction] ?? null) : null;

  const ringColor = tierMeta?.ringColor ?? ecgMeta?.color ?? "text-primary";
  const diagnosisLabel = tierMeta?.label ?? result.label ?? ecgMeta?.label ?? "Unknown";
  const diagnosisColor = tierMeta?.color ?? ecgMeta?.color ?? "text-primary";

  const hasECGData = result.ecg_confidence != null && result.probabilities;
  const hasBioData = result.rf_confidence != null || result.xgb_confidence != null;
  const hasFactors = (result.critical_factors?.length ?? 0) + (result.moderate_factors?.length ?? 0) + (result.lifestyle_factors?.length ?? 0) > 0;

  const tabs: ResultTab[] = ["overview"];
  if (mode === "both" && (hasBioData || hasECGData)) tabs.push("breakdown");
  if (hasFactors) tabs.push("factors");

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* ── Top card: ring + diagnosis + tier bar ── */}
      <div className={`rounded-2xl border ${tierMeta?.border ?? "border-border"} ${tierMeta?.bg ?? "bg-card"} p-5`}>

        <div className="flex items-center gap-5 mb-4">
          {/* Ring */}
          <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center">
            <ConfidenceRing pct={displayConf} color={ringColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-lg font-bold tabular-nums ${ringColor}`}>{displayConf.toFixed(0)}%</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">conf.</span>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Risk Assessment</p>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {tierMeta && <span className={`text-xl font-bold leading-tight ${diagnosisColor}`}>{tierMeta.icon} {diagnosisLabel}</span>}
              {ecgMeta && <span className={`text-xl font-bold leading-tight ${diagnosisColor}`}>{ecgMeta.label}</span>}
              {tierMeta && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierMeta.badgeBg} ${tierMeta.badge}`}>
                  {tier}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tierMeta?.sublabel ?? ecgMeta?.desc ?? ""}
            </p>
            <div className="mt-2">
              <ModeChip mode={mode} />
            </div>
          </div>
        </div>

        {/* 3-tier bar — only for biometrics/both */}
        {tier && (
          <div className="mt-1">
            <TierBar tier={tier} />
          </div>
        )}

        {/* Clinical advice */}
        {tierMeta && (
          <div className="mt-4 p-3 rounded-xl bg-background/50 border border-border text-xs text-muted-foreground leading-relaxed flex gap-2">
            <span className="flex-shrink-0">💡</span>
            <span>{tierMeta.advice}</span>
          </div>
        )}

        {/* Combined boost callout */}
        {mode === "both" && result.rf_confidence != null && result.ecg_confidence != null && (
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary/80 leading-relaxed flex gap-2">
            <span>⚡</span>
            <span>
              Biometric score {result.rf_confidence.toFixed(0)}% + ECG score {result.ecg_confidence.toFixed(0)}%
              → fused confidence <span className="font-bold">{displayConf.toFixed(1)}%</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Sub-tabs ── */}
      {tabs.length > 1 && (
        <div className="flex gap-1 p-1 bg-muted/40 border border-border rounded-xl w-fit">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 ${
                tab === t ? "bg-background text-foreground border border-border shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "overview" ? "Overview" : t === "breakdown" ? "Model Breakdown" : "Risk Factors"}
            </button>
          ))}
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          {/* ECG class probs if available */}
          {hasECGData && result.probabilities && (
            <>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">ECG Class Probabilities</p>
              <ProbBar label="Normal ECG" value={result.probabilities.normal * 100} color="text-emerald-400" delay={0} />
              <ProbBar label="Myocardial Infarction" value={result.probabilities.mi * 100} color="text-red-400" delay={80} />
              <ProbBar label="Abnormal Heartbeat" value={result.probabilities.abnormal * 100} color="text-amber-400" delay={160} />
            </>
          )}
          {/* Overall confidence bar */}
          <div className="pt-2">
            <ProbBar label="Overall Confidence" value={displayConf} color={ringColor} delay={240} />
          </div>
        </div>
      )}

      {/* ── MODEL BREAKDOWN ── */}
      {tab === "breakdown" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Individual Model Scores</p>
          {result.rf_confidence != null && (
            <ProbBar label="Random Forest" value={result.rf_confidence} color="text-blue-400" delay={0} />
          )}
          {result.xgb_confidence != null && (
            <ProbBar label="XGBoost" value={result.xgb_confidence} color="text-violet-400" delay={80} />
          )}
          {result.ecg_confidence != null && (
            <ProbBar label="ECG CNN (ResNet18)" value={result.ecg_confidence} color="text-primary" delay={160} />
          )}
          <div className="pt-2 border-t border-border">
            <ProbBar label="Fused Confidence" value={displayConf} color={ringColor} delay={240} />
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Biometrics weighted 60%, ECG weighted 40%. Fusion consistently yields higher confidence than individual models alone.
          </p>
        </div>
      )}

      {/* ── RISK FACTORS ── */}
      {tab === "factors" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          {(result.critical_factors?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-red-400/70 mb-2">Critical</p>
              <div className="flex flex-wrap gap-2">
                {result.critical_factors!.map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400">{f}</span>
                ))}
              </div>
            </div>
          )}
          {(result.moderate_factors?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400/70 mb-2">Moderate</p>
              <div className="flex flex-wrap gap-2">
                {result.moderate_factors!.map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">{f}</span>
                ))}
              </div>
            </div>
          )}
          {(result.lifestyle_factors?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-blue-400/70 mb-2">Lifestyle</p>
              <div className="flex flex-wrap gap-2">
                {result.lifestyle_factors!.map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400">{f}</span>
                ))}
              </div>
            </div>
          )}
          {!hasFactors && (
            <p className="text-sm text-muted-foreground text-center py-4">No significant risk factors identified.</p>
          )}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300/70 text-xs leading-relaxed flex gap-2">
        <span className="flex-shrink-0">⚠</span>
        <span>AI-generated analysis only. Does not replace professional medical diagnosis. Always consult a qualified cardiologist.</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ECG UPLOAD PANEL
// ─────────────────────────────────────────────────────────────────

function ECGUploadPanel({
  file, onFile, onClear
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    onFile(f);
  }, [onFile]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">ECG Image</p>
          <p className="text-xs text-muted-foreground">Optional — PNG, JPG supported</p>
        </div>
        {file && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            Remove
          </button>
        )}
      </div>

      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => {
          if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
          flex flex-col items-center justify-center text-center min-h-[160px] p-4 select-none
          ${dragging ? "border-primary bg-primary/5 scale-[1.01]"
            : file ? "border-border hover:border-primary/40"
            : "border-border hover:border-primary/40 hover:bg-muted/20"}
        `}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

        {preview ? (
          <div className="w-full space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="ECG" className="max-h-28 w-full object-contain rounded-lg" />
            <div className="flex items-center justify-center gap-1.5">
              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{file?.name}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{dragging ? "Release to upload" : "Drop ECG image here"}</p>
            <p className="text-xs text-muted-foreground/50">or click to browse</p>
          </div>
        )}
      </div>

      {/* ECG-only hint */}
      {file && (
        <p className="text-xs text-primary/70 flex gap-1.5 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          ECG added — will be analysed alongside biometrics (or alone if form is skipped)
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HISTORY ROW
// ─────────────────────────────────────────────────────────────────

function HistoryRow({
  item, onClick
}: {
  item: ReturnType<typeof loadHistory>[number];
  onClick: () => void;
}) {
  const { result, mode, ts } = item;
  const isBio = mode === "biometrics" || mode === "both";
  const isPositive = result.prediction === 1;
  const color = isBio
    ? (isPositive ? "text-red-400" : "text-emerald-400")
    : (ECG_LABELS[result.prediction]?.color ?? "text-primary");
  const dot = isBio
    ? (isPositive ? "bg-red-400" : "bg-emerald-400")
    : (ECG_LABELS[result.prediction]?.dot ?? "bg-primary");
  const label = isBio
    ? (isPositive ? "High CAD Risk" : "Low CAD Risk")
    : (result.label ?? ECG_LABELS[result.prediction]?.label ?? "Unknown");

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/40 transition-colors text-left group">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${color}`}>{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <ModeChip mode={mode} />
          <span className="text-xs text-muted-foreground/50">{new Date(ts).toLocaleDateString()}</span>
        </div>
      </div>
      <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${color}`}>{result.confidence.toFixed(0)}%</span>
      <svg className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

export default function Predict() {
  const { language } = useLanguage();
  const t = translations[language];

  // Input state
  const [ecgFile, setEcgFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Record<string, any> | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [resultMode, setResultMode] = useState<InputMode>("biometrics");
  const [error, setError] = useState<string | null>(null);
  const [pageTab, setPageTab] = useState<"analyse" | "history">("analyse");
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "error">("checking");

  // History
  const [history, setHistory] = useState<ReturnType<typeof loadHistory>>([]);
  useEffect(() => { setHistory(loadHistory()); }, []);

  // Derived mode
  const currentMode: InputMode = formData && ecgFile ? "both" : formData ? "biometrics" : ecgFile ? "ecg" : "biometrics";

  // ── Backend check ──
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ age: 16425, gender: 1, height: 170, weight: 70, ap_hi: 120, ap_lo: 80, cholesterol: 1, gluc: 1, smoke: 0, alco: 0, active: 1 }),
        });
        setBackendStatus(res.ok ? "connected" : "error");
      } catch { setBackendStatus("error"); }
    };
    check();
  }, []);

  // ── Submit ──
  const handleFormSubmit = useCallback(async (fd: Record<string, any>, file?: File) => {
    const resolvedFile = file ?? ecgFile ?? undefined;
    const mode: InputMode = fd && resolvedFile ? "both" : fd ? "biometrics" : resolvedFile ? "ecg" : "biometrics";

    setLoading(true);
    setError(null);
    setFormData(fd);

    try {
      let data: PredictResult;

      if (mode === "ecg" && resolvedFile) {
        // ECG-only → /api/ecg
        const body = new FormData();
        body.append("ecg", resolvedFile);
        const res = await fetch("/api/ecg", { method: "POST", body });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
        const raw = await res.json();
        data = {
          prediction: raw.prediction,
          confidence: raw.confidence,
          ecg_confidence: raw.confidence,
          label: raw.label,
          probabilities: raw.probabilities,
        };
      } else {
        // Biometrics only or both → /api/predict
        const body = new FormData();
        Object.entries(fd).forEach(([k, v]) => body.append(k, String(v)));
        if (resolvedFile) body.append("ecg", resolvedFile);
        const res = await fetch("/api/predict", { method: "POST", body });
        if (!res.ok) throw new Error("Prediction failed");
        data = await res.json();
      }

      setResult(data);
      setResultMode(mode);

      const updated = [{ result: data, mode, ts: new Date().toISOString() }, ...history];
      setHistory(updated);
      saveHistory(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [ecgFile, history]);

  // ECG-only submit (no biometrics form)
  const handleECGOnly = async () => {
    if (!ecgFile) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("ecg", ecgFile);
      const res = await fetch("/api/ecg", { method: "POST", body });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
      const raw = await res.json();
      const data: PredictResult = {
        prediction: raw.prediction,
        confidence: raw.confidence,
        ecg_confidence: raw.confidence,
        label: raw.label,
        probabilities: raw.probabilities,
      };
      setResult(data);
      setResultMode("ecg");
      const updated = [{ result: data, mode: "ecg" as InputMode, ts: new Date().toISOString() }, ...history];
      setHistory(updated);
      saveHistory(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ── PDF download ──
  const downloadPDF = async () => {
    if (!result || !formData) return;
    const res = await fetch("/api/predict/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "health-report.pdf"; a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(HISTORY_KEY); };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

          {/* ── Page Header ── */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-primary/70">
                AI · Heart Risk Assessment
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
              {t.predictTitle}
            </h1>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              {t.predictSubtitle}
            </p>
          </div>

          {/* ── Top bar: backend status + page tabs ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            {/* Backend status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                backendStatus === "connected" ? "bg-emerald-500" :
                backendStatus === "error" ? "bg-red-500" : "bg-yellow-500 animate-pulse"
              }`} />
              <span className="text-xs text-muted-foreground">
                {backendStatus === "connected" ? t.backendConnected :
                 backendStatus === "error" ? t.backendError : t.backendChecking}
              </span>
            </div>

            {/* Page tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 border border-border rounded-xl">
              {(["analyse", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPageTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    pageTab === tab ? "bg-background text-foreground border border-border shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "analyse" ? "🫀 Analyse" : `🕒 History (${history.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════ ANALYSE TAB ══════════════════ */}
          {pageTab === "analyse" && (
            <div className="grid lg:grid-cols-5 gap-6">

              {/* ── LEFT: Input (3 cols) ── */}
              <div className="lg:col-span-3 space-y-5">

                {/* Input mode indicator */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex gap-2 flex-wrap">
                    {(["biometrics", "ecg", "both"] as InputMode[]).map((m) => (
                      <div key={m} className={`flex items-center gap-1.5 text-xs transition-opacity ${currentMode === m ? "opacity-100" : "opacity-30"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          m === "biometrics" ? "bg-blue-400" : m === "ecg" ? "bg-violet-400" : "bg-primary"
                        }`} />
                        <span className="text-muted-foreground capitalize">{m === "both" ? "Both (highest accuracy)" : m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Biometrics form */}
                <Card className="p-6 border border-border">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <p className="text-sm font-semibold text-foreground">Biometric Data</p>
                    <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                  </div>
                  <PredictionForm
                    onSubmit={(fd, file) => handleFormSubmit(fd, file)}
                    loading={loading}
                    // Pass the ECG file from our state so the form can include it
                    externalEcgFile={ecgFile}
                  />
                </Card>

                {/* ECG Upload — separate section */}
                <Card className="p-6 border border-border">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-violet-400" />
                    <p className="text-sm font-semibold text-foreground">ECG Image</p>
                    <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                  </div>
                  <ECGUploadPanel
                    file={ecgFile}
                    onFile={(f) => { setEcgFile(f); setResult(null); setError(null); }}
                    onClear={() => setEcgFile(null)}
                  />
                  {/* ECG-only analyse button (shown only when ECG uploaded but no biometrics submitted) */}
                  {ecgFile && !loading && (
                    <button
                      onClick={handleECGOnly}
                      className="mt-4 w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-colors"
                    >
                      ⚡ Analyse ECG Only
                    </button>
                  )}
                </Card>

                <NearbyHospitals />
              </div>

              {/* ── RIGHT: Result (2 cols) ── */}
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="rounded-2xl border border-border bg-card h-full min-h-[400px] flex flex-col items-center justify-center gap-5 p-10">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-[3px] border-primary/15 border-t-primary animate-spin" />
                      <div className="absolute inset-[6px] rounded-full border-[2px] border-primary/10 border-b-primary/50 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
                      <svg className="absolute inset-0 m-auto w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground text-sm">Running Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {resultMode === "both" ? "Fusing biometric + ECG signals…" : "Processing neural inference…"}
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-3">
                    <div className="text-2xl">❌</div>
                    <p className="text-red-400 font-semibold text-sm">{t.errorTitle}</p>
                    <p className="text-red-400/80 text-sm">{error}</p>
                    <p className="text-red-400/50 text-xs">{t.errorHint}</p>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <ResultDisplay result={result} mode={resultMode} />
                    {(resultMode === "biometrics" || resultMode === "both") && formData && (
                      <button
                        onClick={downloadPDF}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF Report
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/10 h-full min-h-[400px] flex flex-col items-center justify-center gap-4 p-10">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-medium text-muted-foreground/60">{t.emptyResultHint}</p>
                      <p className="text-xs text-muted-foreground/40">Fill biometrics, upload an ECG, or both for the most accurate result.</p>
                    </div>
                    {/* Mode tips */}
                    <div className="mt-2 space-y-2 w-full max-w-xs">
                      {[
                        { color: "bg-blue-400", label: "Biometrics only", tip: "RF + XGBoost ensemble" },
                        { color: "bg-violet-400", label: "ECG only", tip: "ResNet18 CNN" },
                        { color: "bg-primary", label: "Both inputs", tip: "Fused model · best accuracy" },
                      ].map(({ color, label, tip }) => (
                        <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground/50">
                          <div className={`w-1.5 h-1.5 rounded-full ${color} flex-shrink-0`} />
                          <span className="font-medium text-muted-foreground/60">{label}</span>
                          <span>—</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════ HISTORY TAB ══════════════════ */}
          {pageTab === "history" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Past Analyses</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Up to 20 results stored locally</p>
                </div>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              <div className="p-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="text-4xl opacity-20">🕒</div>
                    <p className="text-sm text-muted-foreground">No analyses yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {history.map((item, i) => (
                      <HistoryRow key={i} item={item} onClick={() => {
                        setResult(item.result);
                        setResultMode(item.mode);
                        setPageTab("analyse");
                      }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Summary stats */}
              {history.length > 0 && (
                <div className="px-6 py-5 border-t border-border grid grid-cols-3 gap-3">
                  {[
                    { label: "Biometrics", key: "biometrics", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/25" },
                    { label: "ECG Only", key: "ecg", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/25" },
                    { label: "Combined", key: "both", color: "text-primary", bg: "bg-primary/10 border-primary/25" },
                  ].map(({ label, key, color, bg }) => (
                    <div key={key} className={`rounded-xl border p-4 text-center ${bg}`}>
                      <p className={`text-3xl font-bold ${color}`}>
                        {history.filter((h) => h.mode === key).length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
