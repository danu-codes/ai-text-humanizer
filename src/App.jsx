import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  ScanSearch,
  RefreshCw,
  Copy,
  Check,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  ArrowRight,
  FileText,
  Edit3,
  Eye,
  Columns,
  Layers,
  ChevronDown,
  Info,
  Zap,
  Activity,
  SlidersHorizontal,
  X
} from "lucide-react";

// API Base URL configured via Vite environment variable or default local/ngrok backend
const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";

const TONES = [
  { id: "General", label: "General", desc: "Balanced & natural" },
  { id: "Academic", label: "Academic", desc: "Rigorous & formal" },
  { id: "Casual", label: "Casual", desc: "Conversational rhythm" },
  { id: "Professional", label: "Professional", desc: "Direct & concise" }
];

const SAMPLE_AI_TEXT =
  "Furthermore, it is crucial to underscore the multifaceted nature of artificial intelligence in modern software engineering. " +
  "By leveraging advanced machine learning paradigms, organizations can seamlessly optimize operational workflows. " +
  "I tested this pipeline on my local machine yesterday and it ran surprisingly fast. " +
  "In conclusion, embracing these transformative technologies is paramount for maintaining a competitive edge.";

// Cliché AI phrase patterns used for local fallback detection & analysis heuristics
const AI_PATTERNS = [
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\bin conclusion\b/i,
  /\bcrucial\b/i,
  /\bunderscore\b/i,
  /\bmultifaceted\b/i,
  /\bleveraging\b/i,
  /\bparadigms?\b/i,
  /\bseamlessly\b/i,
  /\bparamount\b/i,
  /\bdelve\b/i,
  /\btestament\b/i,
  /\bit is important to note\b/i,
  /\bplays a pivotal role\b/i,
  /\btapestry\b/i,
  /\blandscape\b/i,
  /\bfostering\b/i,
  /\bholistic\b/i
];

export default function App() {
  const [rawText, setRawText] = useState(SAMPLE_AI_TEXT);
  const [tone, setTone] = useState("General");
  const [sentences, setSentences] = useState([]); // [{ id, text, ai_score, is_ai, humanized_text, is_regenerating, note }]
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHumanizingAll, setIsHumanizingAll] = useState(false);
  const [selectedSentenceId, setSelectedSentenceId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [apiMode, setApiMode] = useState("live"); // "live" | "demo"
  const [temperature, setTemperature] = useState(0.75);
  const [isEditMode, setIsEditMode] = useState(true);
  const [mobileView, setMobileView] = useState("split"); // "split" | "source" | "humanized"
  const [showSettings, setShowSettings] = useState(false);

  // Auto-select first sentence once analysis completes
  useEffect(() => {
    if (sentences.length > 0 && selectedSentenceId === null) {
      setSelectedSentenceId(sentences[0].id);
    }
  }, [sentences, selectedSentenceId]);

  // Aggregate stats: Before vs After AI Probability & Sentence metrics
  const stats = useMemo(() => {
    if (sentences.length === 0) {
      return {
        beforeScore: 0,
        afterScore: 0,
        flaggedCount: 0,
        highRiskCount: 0,
        totalWords: rawText.trim() ? rawText.trim().split(/\s+/).length : 0
      };
    }

    const totalBefore = sentences.reduce((acc, s) => acc + s.ai_score, 0);
    const beforeScore = Math.round((totalBefore / sentences.length) * 100);

    const flaggedCount = sentences.filter((s) => s.ai_score >= 0.5).length;
    const highRiskCount = sentences.filter((s) => s.ai_score >= 0.75).length;

    // Estimate post-humanization score
    const totalAfter = sentences.reduce((acc, s) => {
      if (s.humanized_text && s.humanized_text !== s.text) {
        return acc + Math.min(0.12, s.ai_score * 0.15);
      }
      return acc + s.ai_score;
    }, 0);
    const afterScore = Math.round((totalAfter / sentences.length) * 100);

    const totalWords = sentences.reduce((acc, s) => acc + s.text.split(/\s+/).length, 0);

    return {
      beforeScore,
      afterScore,
      flaggedCount,
      highRiskCount,
      totalWords
    };
  }, [sentences, rawText]);

  // Selected sentence object reference
  const selectedSentence = useMemo(() => {
    if (selectedSentenceId === null) return null;
    return sentences.find((s) => s.id === selectedSentenceId) || null;
  }, [sentences, selectedSentenceId]);

  // Heuristic sentence splitter & fallback local AI risk detector
  const runLocalFallbackAnalysis = (text) => {
    const rawSentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];

    return rawSentences
      .map((s) => s.trim())
      .filter(Boolean)
      .map((sentence, idx) => {
        const words = sentence.split(/\s+/);
        const wordCount = words.length;
        const hits = AI_PATTERNS.filter((pat) => pat.test(sentence)).length;

        let score = 0.18;
        if (hits > 0) score += hits * 0.32;
        if (wordCount > 18) score += 0.15;
        if (wordCount < 8) score -= 0.08;

        const avgWordLen =
          words.reduce((acc, w) => acc + w.replace(/[^a-zA-Z]/g, "").length, 0) /
          Math.max(wordCount, 1);
        if (avgWordLen > 6.2) score += 0.12;

        const finalScore = Math.min(0.98, Math.max(0.04, Number(score.toFixed(2))));

        let note = "Natural rhythm & vocabulary";
        if (finalScore >= 0.75) note = "Stiff transitions & cliché AI phrasing detected";
        else if (finalScore >= 0.5) note = "Elevated formal density; slightly robotic flow";

        return {
          id: idx,
          text: sentence,
          ai_score: finalScore,
          is_ai: finalScore >= 0.5,
          humanized_text: "",
          is_regenerating: false,
          note
        };
      });
  };

  // Local rule-based rephraser engine for fallback preview mode
  const localRewriteEngine = (sentence, selectedTone) => {
    let rewritten = sentence;

    rewritten = rewritten
      .replace(/Furthermore,\s*/i, "In addition, ")
      .replace(/Moreover,\s*/i, "Also, ")
      .replace(/In conclusion,\s*/i, "Ultimately, ")
      .replace(/it is crucial to underscore the multifaceted nature of/i, "there are key sides to")
      .replace(/By leveraging advanced machine learning paradigms,\s*/i, "Using modern machine learning models, ")
      .replace(/organizations can seamlessly optimize operational workflows\./i, "teams can streamline their work quickly.")
      .replace(/is paramount for maintaining a competitive edge\./i, "is essential to stay ahead.");

    if (selectedTone === "Casual") {
      rewritten = rewritten
        .replace(/organizations/i, "teams")
        .replace(/essential/i, "vital")
        .replace(/Ultimately,/i, "At the end of the day,");
    } else if (selectedTone === "Academic") {
      rewritten = rewritten
        .replace(/In addition,/i, "Additionally,")
        .replace(/streamline their work/i, "enhance operational efficiency");
    } else if (selectedTone === "Professional") {
      rewritten = rewritten
        .replace(/there are key sides to/i, "key factors define")
        .replace(/stay ahead/i, "maintain market leadership");
    }

    return rewritten;
  };

  // 1. Scan text for sentence-level AI probabilities
  const handleAnalyze = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    setIsEditMode(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ text: rawText })
      });

      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      setApiMode("live");

      setSentences(
        data.map((item, idx) => ({
          id: item.id ?? idx,
          text: item.text,
          ai_score: item.ai_score,
          is_ai: item.ai_score >= 0.5,
          humanized_text: "",
          is_regenerating: false,
          note:
            item.ai_score >= 0.75
              ? "High synthetic probability flagged by Qwen model"
              : item.ai_score >= 0.5
                ? "Moderate AI transition density"
                : "Organic human phrasing"
        }))
      );
    } catch {
      setApiMode("demo");
      setSentences(runLocalFallbackAnalysis(rawText));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Humanize a single sentence via API or local fallback engine
  const humanizeSingleSentence = async (sentenceObj, selectedTone) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/humanize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          text: sentenceObj.text,
          tone: selectedTone,
          temperature: temperature
        })
      });

      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      return data.humanized_text;
    } catch {
      await new Promise((r) => setTimeout(r, 380));
      return localRewriteEngine(sentenceObj.text, selectedTone);
    }
  };

  // 3. Humanize all flagged sentences (>= 50% AI score)
  const handleHumanizeAll = async () => {
    if (!rawText.trim()) return;
    setIsHumanizingAll(true);

    let currentSentences = sentences;
    if (currentSentences.length === 0) {
      currentSentences = runLocalFallbackAnalysis(rawText);
      setSentences(currentSentences);
      setIsEditMode(false);
    }

    const updated = await Promise.all(
      currentSentences.map(async (s) => {
        if (s.ai_score >= 0.5) {
          const rewritten = await humanizeSingleSentence(s, tone);
          return { ...s, humanized_text: rewritten };
        }
        return { ...s, humanized_text: s.text };
      })
    );

    setSentences(updated);
    setIsHumanizingAll(false);
  };

  // 4. Click-to-regenerate a single selected sentence
  const handleRegenerateSentence = async (id) => {
    const target = sentences.find((s) => s.id === id);
    if (!target) return;

    setSelectedSentenceId(id);
    setSentences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_regenerating: true } : s))
    );

    const freshRewrite = await humanizeSingleSentence(target, tone);

    setSentences((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, humanized_text: freshRewrite, is_regenerating: false }
          : s
      )
    );
  };

  // Full output text string reconstruction
  const fullOutputText = useMemo(() => {
    if (sentences.length === 0) return "";
    return sentences.map((s) => s.humanized_text || s.text).join(" ");
  }, [sentences]);

  const handleCopy = () => {
    if (!fullOutputText) return;
    navigator.clipboard.writeText(fullOutputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Highlight styling helper for sentence confidence scores
  const getSentenceClasses = (score, isSelected) => {
    const ring = isSelected ? "ring-2 ring-[#141413] ring-offset-1" : "";
    if (score >= 0.75) {
      return `bg-red-500/15 text-[#141413] border-b-2 border-red-600 hover:bg-red-500/25 ${ring}`;
    }
    if (score >= 0.5) {
      return `bg-amber-500/20 text-[#141413] border-b-2 border-amber-500 hover:bg-amber-500/30 ${ring}`;
    }
    return `text-[#141413] hover:bg-stone-200/70 ${ring}`;
  };

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#141413] font-sans selection:bg-stone-300 selection:text-black flex flex-col antialiased">
      {/* Editorial Top Masthead Header */}
      <header className="border-b border-[#E2DFD7] bg-[#F6F4EF] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">

          {/* Brand Header */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#141413] text-[#F6F4EF] flex items-center justify-center font-serif text-lg font-bold tracking-tighter shrink-0">
                V
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif font-black text-lg sm:text-xl tracking-tight text-[#141413] uppercase">
                    VERBATIM
                  </h1>
                  <span className="text-[10px] font-mono font-semibold tracking-widest text-[#141413] bg-stone-200 border border-[#E2DFD7] px-1.5 py-0.5 rounded uppercase">
                    Qwen2.5-3B
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-mono text-[#575550] hidden sm:block">
                  Sentence-Level AI Risk Scanner & Editorial Humanizer
                </p>
              </div>
            </div>

            {/* Mobile Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="md:hidden p-2 rounded text-[#141413] hover:bg-stone-200 border border-[#E2DFD7]"
              aria-label="Toggle settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Tone Selector Pills & Controls (Responsive Wrap) */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto ${showSettings ? "flex" : "hidden md:flex"}`}>

            {/* Tone Selector */}
            <div className="flex items-center gap-1 bg-[#E2DFD7]/60 p-1 rounded border border-[#E2DFD7] overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono text-[#575550] uppercase px-1.5 hidden sm:inline-flex items-center gap-1 shrink-0">
                <Sliders className="w-3 h-3 text-[#141413]" /> Tone:
              </span>
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0 whitespace-nowrap ${tone === t.id
                      ? "bg-[#141413] text-[#F6F4EF] shadow-sm font-semibold"
                      : "text-[#575550] hover:text-[#141413] hover:bg-stone-300/50"
                    }`}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Controls & API Status Badges */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Temperature Control */}
              <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 bg-white border border-[#E2DFD7] rounded shadow-xs">
                <span className="text-[#575550] text-[11px]">Temp:</span>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-14 sm:w-16 accent-[#141413] cursor-pointer"
                />
                <span className="font-semibold text-[#141413] text-[11px]">{temperature.toFixed(2)}</span>
              </div>

              {/* API Mode Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 bg-white border border-[#141413] rounded shadow-xs">
                <span
                  className={`w-2 h-2 rounded-full ${apiMode === "live" ? "bg-emerald-600 animate-pulse" : "bg-amber-500"
                    }`}
                />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  {apiMode === "live" ? "API Live" : "Fallback"}
                </span>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* Telemetry Strip & Mobile View Switcher */}
      <div className="border-b border-[#E2DFD7] bg-[#FAF8F5] px-4 sm:px-6 py-2.5 sticky top-[61px] sm:top-[69px] z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">

          {/* Signal Indicator Legend */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
            <span className="font-bold text-[#141413] uppercase tracking-wider shrink-0">
              Risk Levels:
            </span>
            <span className="flex items-center gap-1.5 text-[#141413] shrink-0">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-500/30 border border-red-600" />
              High (&ge;75%)
            </span>
            <span className="flex items-center gap-1.5 text-[#141413] shrink-0">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/30 border border-amber-500" />
              Moderate (50–74%)
            </span>
            <span className="flex items-center gap-1.5 text-[#141413] shrink-0">
              <span className="w-2.5 h-2.5 rounded-xs bg-stone-300 border border-stone-400" />
              Human (&lt;50%)
            </span>
          </div>

          {/* Scores Readout & Mobile Mode Switcher */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {sentences.length > 0 && (
              <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#575550]">Original:</span>
                  <span className="font-bold text-red-700 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded">
                    {stats.beforeScore}% AI
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#575550]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[#575550]">Revision:</span>
                  <span className="font-bold text-emerald-800 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded">
                    {stats.afterScore}% AI
                  </span>
                </div>
              </div>
            )}

            {/* Mobile/Tablet View Switcher Pill Toggle */}
            <div className="flex lg:hidden items-center bg-stone-200/80 p-0.5 rounded border border-[#E2DFD7] shrink-0 ml-auto md:ml-0">
              <button
                onClick={() => setMobileView("split")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${mobileView === "split" ? "bg-[#141413] text-[#F6F4EF]" : "text-[#575550]"
                  }`}
                title="Stacked Split View"
              >
                Split
              </button>
              <button
                onClick={() => setMobileView("source")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${mobileView === "source" ? "bg-[#141413] text-[#F6F4EF]" : "text-[#575550]"
                  }`}
              >
                Source
              </button>
              <button
                onClick={() => setMobileView("humanized")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${mobileView === "humanized" ? "bg-[#141413] text-[#F6F4EF]" : "text-[#575550]"
                  }`}
              >
                Revision
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Manuscript Grid Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* LEFT PANE: Source Manuscript & AI Detection */}
        <section
          className={`flex-col bg-white border-2 border-[#141413] rounded-none shadow-[3px_3px_0px_0px_rgba(20,20,19,1)] sm:shadow-[4px_4px_0px_0px_rgba(20,20,19,1)] overflow-hidden min-h-[420px] sm:min-h-[500px] ${mobileView === "humanized" ? "hidden lg:flex" : "flex"
            }`}
        >
          <div className="px-4 sm:px-5 py-3 border-b border-[#141413] bg-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif font-bold text-sm tracking-wide text-[#141413]">
              <span className="font-mono text-xs text-blue-700 font-semibold uppercase">01 /</span>
              <span>Source Manuscript</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              {sentences.length > 0 && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="text-[#575550] hover:text-[#141413] underline mr-1 sm:mr-2 text-[11px] sm:text-xs"
                >
                  {isEditMode ? "View Highlights" : "Edit Raw Text"}
                </button>
              )}
              <button
                onClick={() => {
                  setRawText("");
                  setSentences([]);
                  setSelectedSentenceId(null);
                  setIsEditMode(true);
                }}
                className="text-[#575550] hover:text-red-600 transition-colors p-1"
                title="Clear manuscript"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Manuscript / Textarea Input View */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col font-serif">
            {isEditMode || sentences.length === 0 ? (
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste AI-generated manuscript or draft text here..."
                className="w-full flex-1 min-h-[300px] sm:min-h-[360px] bg-transparent text-[#141413] placeholder-stone-400 resize-none focus:outline-none leading-relaxed text-base font-serif"
              />
            ) : (
              <div className="flex-1 min-h-[300px] sm:min-h-[360px] leading-relaxed text-base text-[#141413] space-x-1">
                {sentences.map((s) => (
                  <span
                    key={s.id}
                    onClick={() => setSelectedSentenceId(s.id)}
                    className={`cursor-pointer px-1 py-0.5 transition-all inline rounded-xs font-serif ${getSentenceClasses(
                      s.ai_score,
                      selectedSentenceId === s.id
                    )}`}
                  >
                    {s.text}{" "}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Source Pane Actions Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-[#141413] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <span className="text-[#575550] text-[11px] sm:text-xs">
              {rawText.trim() ? rawText.trim().split(/\s+/).length : 0} words
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !rawText.trim()}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#141413] font-semibold border border-[#141413] transition-all disabled:opacity-40 text-xs"
              >
                <ScanSearch className="w-3.5 h-3.5 text-amber-600" />
                {isAnalyzing ? "Scanning..." : "Scan AI"}
              </button>

              <button
                onClick={handleHumanizeAll}
                disabled={isHumanizingAll || !rawText.trim()}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold border border-[#141413] transition-all shadow-[2px_2px_0px_0px_rgba(20,20,19,1)] disabled:opacity-40 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isHumanizingAll ? "Humanizing..." : "Humanize Flagged"}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT PANE: Humanized Revision Pane */}
        <section
          className={`flex-col bg-white border-2 border-[#141413] rounded-none shadow-[3px_3px_0px_0px_rgba(20,20,19,1)] sm:shadow-[4px_4px_0px_0px_rgba(20,20,19,1)] overflow-hidden min-h-[420px] sm:min-h-[500px] ${mobileView === "source" ? "hidden lg:flex" : "flex"
            }`}
        >
          <div className="px-4 sm:px-5 py-3 border-b border-[#141413] bg-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif font-bold text-sm tracking-wide text-[#141413]">
              <span className="font-mono text-xs text-emerald-700 font-semibold uppercase">02 /</span>
              <span>Humanized Revision</span>
            </div>

            <button
              onClick={handleCopy}
              disabled={!fullOutputText}
              className="flex items-center gap-1.5 font-mono text-xs px-2.5 sm:px-3 py-1 bg-stone-100 hover:bg-stone-200 border border-[#141413] text-[#141413] transition-colors disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-800 font-semibold text-[11px] sm:text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px] sm:text-xs">Copy Revision</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 p-4 sm:p-6 flex flex-col font-serif">
            {sentences.length === 0 ? (
              <div className="flex-1 min-h-[300px] sm:min-h-[360px] flex flex-col items-center justify-center text-center text-stone-400 p-6 border border-dashed border-[#E2DFD7]">
                <FileText className="w-10 h-10 mb-3 text-stone-300" />
                <p className="font-serif text-base sm:text-lg font-medium text-stone-700">
                  Revision Draft Empty
                </p>
                <p className="font-sans text-xs max-w-sm mt-1 text-[#575550] leading-relaxed">
                  Click <strong>Scan AI</strong> to highlight synthetic phrases, or hit{" "}
                  <strong>Humanize Flagged</strong> to generate an organic, publication-ready draft.
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-[300px] sm:min-h-[360px] leading-relaxed text-base text-[#141413] space-x-1">
                {sentences.map((s) => {
                  const displayText = s.humanized_text || s.text;
                  const wasRewritten = s.humanized_text && s.humanized_text !== s.text;
                  const isSelected = selectedSentenceId === s.id;

                  return (
                    <span
                      key={s.id}
                      onClick={() => handleRegenerateSentence(s.id)}
                      title="Click to regenerate this line with Qwen LoRA"
                      className={`group relative cursor-pointer px-1 py-0.5 transition-all inline rounded-xs font-serif ${s.is_regenerating
                          ? "bg-blue-100 text-blue-900 animate-pulse border-b-2 border-blue-600"
                          : wasRewritten
                            ? "bg-emerald-50 text-emerald-950 border-b-2 border-emerald-600 hover:bg-emerald-100/70"
                            : "text-[#141413] hover:bg-stone-100"
                        } ${isSelected ? "ring-2 ring-[#141413] ring-offset-1" : ""}`}
                    >
                      {displayText}{" "}
                      <RefreshCw
                        className={`w-3 h-3 inline ml-1 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity ${s.is_regenerating ? "animate-spin opacity-100" : ""
                          }`}
                      />
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revision Pane Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-[#141413] bg-[#FAF8F5] flex items-center justify-between font-mono text-xs text-[#575550]">
            <span className="text-[11px] sm:text-xs">
              {fullOutputText ? fullOutputText.trim().split(/\s+/).length : 0} output words
            </span>
            <span className="font-semibold text-[#141413] uppercase text-[11px] sm:text-xs">Tone: {tone}</span>
          </div>
        </section>
      </main>

      {/* Docked Sentence Inspector Drawer */}
      {selectedSentence && (
        <aside className="border-t-2 border-[#141413] bg-[#FAF8F5] px-4 sm:px-6 py-3.5 sticky bottom-0 z-30 shadow-[0px_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">

            {/* Sentence Info & AI Probability Badge */}
            <div className="flex-1 space-y-1 w-full">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="px-2 py-0.5 bg-[#141413] text-[#F6F4EF] font-bold text-[10px] sm:text-[11px] rounded-xs">
                  SENTENCE #{selectedSentence.id + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#575550] text-[11px]">AI Risk:</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 border text-[11px] ${selectedSentence.ai_score >= 0.75
                        ? "bg-red-100 text-red-700 border-red-300"
                        : selectedSentence.ai_score >= 0.5
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                  >
                    {Math.round(selectedSentence.ai_score * 100)}%
                  </span>
                </div>

                <span className="text-stone-400 hidden sm:inline">|</span>
                <span className="text-[#575550] font-sans italic text-[11px] truncate max-w-xs">
                  "{selectedSentence.note}"
                </span>
              </div>

              <div className="font-serif text-xs sm:text-sm text-[#141413] line-clamp-1">
                <strong>Raw:</strong> "{selectedSentence.text}"
              </div>
            </div>

            {/* Regenerate Action Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                onClick={() => handleRegenerateSentence(selectedSentence.id)}
                disabled={selectedSentence.is_regenerating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#141413] hover:bg-stone-800 text-[#F6F4EF] font-semibold transition-all shadow-[2px_2px_0px_0px_rgba(29,78,216,1)] disabled:opacity-40 text-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${selectedSentence.is_regenerating ? "animate-spin" : ""
                    }`}
                />
                <span>Regenerate Line</span>
              </button>
            </div>

          </div>
        </aside>
      )}
    </div>
  );
}