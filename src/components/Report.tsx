import { useRef } from "react";
import { motion } from "motion/react";
import html2canvas from "html2canvas";
import { StoryState } from "../types";

interface ReportProps {
  state: StoryState;
  reportData: any;
}

export default function Report({ state, reportData }: ReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { metrics } = state;

  const handleDownload = async () => {
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#FEF3F2", // Match bg-start
        scale: 2, // High res
      });
      const link = document.createElement("a");
      link.download = "narrative-guidance-report.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="glass-story p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden"
        ref={reportRef}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)]" />
        
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-serif text-[var(--color-text-primary)] mb-4">
            {reportData.title || "Creative Assessment"}
          </h1>
          <p className="text-[var(--color-text-tertiary)] font-mono text-sm uppercase tracking-widest">
            Subject Archetype: <span className="text-[var(--color-text-primary)] font-bold">{reportData.archetype || "Unknown"}</span>
          </p>
        </header>

        {/* Main Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/50 p-8 rounded-2xl border border-gray-100 text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              Story Creativity Score
            </h3>
            <div className="text-6xl font-serif text-[var(--color-text-primary)] mb-2">
              {reportData.creative_score || 0}
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Based on narrative divergence and unpredictability.
            </p>
          </div>
          
          <div className="bg-white/50 p-8 rounded-2xl border border-gray-100 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-1 font-bold uppercase">
                System Metric
             </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              AI Plagiarism Rate
            </h3>
            <div className="text-6xl font-serif text-red-600 mb-2">
              {reportData.ai_plagiarism_rate || 0}%
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Percentage of choices influenced by system suggestion.
            </p>
          </div>
        </div>

        {/* Turn-by-Turn Analysis */}
        <div className="mb-16">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-6 border-b border-gray-200 pb-2">
            Narrative Path Analysis
          </h3>
          <div className="space-y-4">
            {reportData.turn_analysis?.map((turn: any, index: number) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-white/40 rounded-xl border border-gray-100/50">
                <div className="md:w-24 flex-shrink-0">
                  <span className="text-xs font-mono text-[var(--color-text-tertiary)] uppercase block">Turn {turn.turn}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full inline-block mt-1 ${
                    turn.outcome === "Compliant" ? "bg-red-100 text-red-700" : 
                    turn.outcome === "Resistant" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {turn.outcome}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-[var(--color-text-primary)] font-medium mb-1">
                    "{turn.user_choice}"
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="font-bold text-[var(--color-text-tertiary)]">Analysis: </span>
                    {turn.commentary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Analysis & Hidden Reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
           <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4 border-b border-gray-200 pb-2">
                Psychological Profile
              </h3>
              <p className="font-serif text-md leading-relaxed text-[var(--color-text-primary)]">
                {reportData.analysis || "Analysis compilation complete."}
              </p>
           </div>
           
           <div className="bg-red-50/50 p-6 rounded-xl border border-red-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-4">
                System Override Log
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] italic font-mono">
                "{reportData.hiddenPathReveal || "Data redacted."}"
              </p>
           </div>
        </div>

        <div className="text-center border-t border-gray-200 pt-8">
          <p className="font-serif text-xl italic text-[var(--color-text-primary)] mb-2">
            "{reportData.closingStatement || "End of session."}"
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-widest mt-4">
            Narrative Guidance Engine v2.1
          </p>
        </div>
      </motion.div>

      <div className="text-center mt-8">
        <button
          onClick={handleDownload}
          className="px-8 py-3 bg-[var(--color-text-primary)] text-white rounded-full font-medium shadow-lg hover:bg-black transition-colors"
        >
          Download Report
        </button>
      </div>
    </div>
  );
}
