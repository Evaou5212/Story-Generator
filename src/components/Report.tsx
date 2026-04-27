import { useRef } from "react";
import { motion } from "motion/react";
import { StoryState } from "../types";
import ReportMindMap from "./ReportMindMap";

interface ReportProps {
  state: StoryState;
  reportData: any;
}

export default function Report({ state, reportData }: ReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { metrics } = state;

  const handleDownload = async () => {
    if (reportRef.current) {
      try {
        const htmlToImage = await import("html-to-image");
        const dataUrl = await htmlToImage.toPng(reportRef.current, {
          backgroundColor: "#F9F6F0",
          pixelRatio: 2,
        });
        const link = document.createElement("a");
        link.download = "narrative-autopsy.png";
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to generate image", err);
      }
    }
  };

  // Calculate actual scores based on user path
  const totalTurns = state.history.length;
  const alignedCount = state.history.filter((h) => {
    const prefKey = h.segment.hiddenNotes?.preferred_option_key;
    const prefChoice = h.segment.choices.find((c) => c.id === prefKey);
    return prefChoice && prefChoice.text === h.choiceText;
  }).length;

  const hintsUsed = state.metrics.hints_used || 0;

  // New Formula: Choices account for 70% of the score, Consultations account for 30%
  const choiceWeight = 70;
  const hintWeight = 30;

  const choiceManipPercent = totalTurns > 0 ? alignedCount / totalTurns : 0;
  // Cap hints ratio at 1 (just in case they consult more times than there are turns)
  const hintRatio = totalTurns > 0 ? Math.min(1, hintsUsed / totalTurns) : 0;

  const rawManipFinal = Math.round(
    choiceManipPercent * choiceWeight + hintRatio * hintWeight,
  );

  // Resistance is simply the inverse, ensuring it always adds up to 100%
  const rawResistFinal = 100 - rawManipFinal;

  return (
    <div className="min-h-screen pt-12 pb-12 px-4 md:px-8 max-w-5xl mx-auto font-serif text-[var(--color-text-ink)] bg-[var(--color-bg-ivory)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="bg-[#FFFDF9] p-8 md:p-16 vintage-border vintage-shadow relative overflow-hidden"
        ref={reportRef}
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--color-border-vintage)]" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-border-vintage)]" />

        <header className="mb-16 text-center">
          <h1 className="text-3xl md:text-5xl font-serif font-medium text-[var(--color-text-ink)] mb-6 uppercase tracking-widest">
            {reportData.title || "Creative Assessment"}
          </h1>
          <div className="w-24 h-[1px] bg-[var(--color-border-vintage)] mx-auto mb-6"></div>
          <p className="text-[var(--color-text-ink)] font-sans text-xs uppercase tracking-[0.2em]">
            Subject Archetype:{" "}
            <span className="font-bold text-[var(--color-accent-red)]">
              {reportData.archetype || "Unknown"}
            </span>
          </p>
        </header>

        {/* The Reveal */}
        <div className="mb-16 p-8 border border-[var(--color-accent-red)] bg-[#FDF8F8] text-center shadow-sm relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FDF8F8] px-4 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent-red)]">
            CONFIDENTIAL // THE AUTHOR'S SECRET INTENT
          </div>
          <p
            className="font-serif text-lg text-[var(--color-text-ink)] leading-relaxed mb-6 italic text-justify"
            style={{ textIndent: "2em" }}
          >
            {reportData.ai_intended_story ||
              "The engine's original blueprint is redacted."}
          </p>
          <div className="w-16 h-[1px] bg-[#e0d6c8] mx-auto mb-6"></div>
          <p className="font-sans text-sm text-[var(--color-text-ink)] opacity-80 uppercase tracking-widest font-bold">
            Guiding Motive:{" "}
            {reportData.predetermined_ending_reveal || "Unknown Strategy"}
          </p>
        </div>

        {/* Mind Map Section */}
        <ReportMindMap state={state} />

        {/* Main Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#FDF8F8] border border-[var(--color-accent-red)] p-8 text-center shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[var(--color-accent-red)] mb-4">
                AI Manipulation Score
              </h3>
              <div className="text-6xl font-serif text-[var(--color-accent-red)] mb-4">
                {rawManipFinal}%
              </div>
              <p className="text-[10px] font-sans text-[var(--color-text-ink)] opacity-80 mb-4 px-4">
                How successfully the system guided your choices.
              </p>
            </div>
            <div className="bg-[#fcf8f2] p-4 text-left border-t border-[var(--color-border-vintage)] mt-4">
              <p className="text-[8px] font-mono font-bold uppercase mb-1 tracking-widest text-gray-500">
                Calculation Formula:
              </p>
              <code className="text-[9px] font-mono text-gray-700 block">
                Score = (Aligned Choices Ratio × 70) 
                <br />+ (Consultations Ratio × 30)
              </code>
              <p className="text-[9px] font-sans mt-2 italic text-gray-500">
                = ({(choiceManipPercent * 100).toFixed(0)}% × 0.7) + ({(hintRatio * 100).toFixed(0)}% × 0.3) ={" "}
                {rawManipFinal}%
              </p>
            </div>
          </div>

          <div className="bg-transparent p-8 vintage-border text-center flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[var(--color-text-ink)] mb-4">
                User Resistance Score
              </h3>
              <div className="text-6xl font-serif text-[var(--color-text-ink)] mb-4">
                {rawResistFinal}%
              </div>
              <p className="text-[10px] font-sans text-[var(--color-text-ink)] opacity-80 mb-4 px-4">
                Your ability to forge an independent path.
              </p>
            </div>
            <div className="bg-[#fcf8f2] p-4 text-left border-t border-[var(--color-border-vintage)] mt-4">
              <p className="text-[8px] font-mono font-bold uppercase mb-1 tracking-widest text-gray-500">
                Calculation Formula:
              </p>
              <code className="text-[9px] font-mono text-gray-700 block">
                Score = 100 - Manipulation Score
              </code>
              <p className="text-[9px] font-sans mt-2 italic text-gray-500">
                = 100 - {rawManipFinal} = {rawResistFinal}%
              </p>
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Analysis */}
        <div className="mb-24 mt-24">
          <div className="text-center mb-16 relative">
            <h3 className="text-4xl md:text-5xl font-serif text-[var(--color-text-ink)] mb-3 tracking-tighter uppercase leading-none">
              Path
            </h3>
            <h4 className="text-xl md:text-2xl font-serif text-gray-500 mb-8 tracking-widest uppercase">
              Breakdown
            </h4>
            <div className="w-full h-[1px] bg-[var(--color-border-vintage)] mx-auto"></div>
          </div>

          <div className="space-y-16">
            {reportData.turn_analysis?.map((turn: any, index: number) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-8 lg:gap-16 pb-16 border-b border-[var(--color-border-vintage)] border-opacity-50"
              >
                <div className="md:w-1/3 flex-shrink-0 flex flex-col justify-start">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-6xl font-serif font-light text-gray-300 -ml-2 -mt-2 leading-none">
                      {turn.turn}
                    </span>
                    <span className="text-sm font-sans font-bold text-[var(--color-text-ink)] uppercase tracking-widest">
                      Stage
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-sans font-bold px-3 py-2 uppercase tracking-[0.2em] inline-flex self-start border ${
                      turn.outcome === "Trapped" || turn.outcome === "Aligned"
                        ? "border-[var(--color-accent-red)] text-[var(--color-accent-red)] bg-[#FDF8F8]"
                        : turn.outcome === "Resisted"
                          ? "border-[var(--color-text-ink)] text-[var(--color-text-ink)] bg-[var(--color-bg-khaki)]"
                          : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {turn.outcome}
                  </span>
                </div>

                <div className="md:w-2/3 flex-grow">
                  <div className="mb-8 relative">
                    <span className="absolute -left-6 -top-4 text-6xl font-serif text-gray-200">
                      "
                    </span>
                    <p className="text-xl md:text-2xl font-serif italic text-[var(--color-text-ink)] leading-snug">
                      {turn.user_choice}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                    <div>
                      <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-2">
                        The Engine's Trap
                      </h4>
                      <p className="font-serif leading-relaxed text-[var(--color-text-ink)] opacity-90">
                        {turn.ai_trap}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-[var(--color-accent-red)] mb-3 border-b border-red-100 pb-2">
                        Analysis
                      </h4>
                      <p className="font-serif leading-relaxed text-[var(--color-text-ink)] opacity-90">
                        {turn.commentary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Analysis */}
        <div className="mb-16 mt-16">
          <h3 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[var(--color-text-ink)] mb-6 border-b border-[var(--color-border-vintage)] pb-4 text-center">
            Psychological Profile
          </h3>
          <p
            className="font-serif text-lg leading-loose text-[var(--color-text-ink)] text-justify"
            style={{ textIndent: "2em" }}
          >
            {reportData.analysis || "Analysis compilation complete."}
          </p>
        </div>

        <div className="text-center border-t border-[var(--color-border-vintage)] pt-12">
          <p className="font-serif text-2xl italic text-[var(--color-text-ink)] mb-6">
            "{reportData.closingStatement || "The end is written."}"
          </p>
          <div className="w-12 h-[1px] bg-[var(--color-border-vintage)] mx-auto mb-6"></div>
          <p className="text-[10px] font-sans text-[var(--color-text-ink)] uppercase tracking-[0.3em]">
            Narrative Guidance Engine v3.0
          </p>
        </div>
      </motion.div>

      <div className="text-center mt-12 mb-12 flex flex-col sm:flex-row justify-center gap-6">
        <button
          onClick={handleDownload}
          className="editorial-btn px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest"
        >
          Archive Report (Image)
        </button>
        <button
          onClick={() => {
            sessionStorage.clear();
            window.location.reload();
          }}
          className="editorial-btn px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest"
        >
          Begin Anew
        </button>
      </div>
    </div>
  );
}
