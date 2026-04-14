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
        backgroundColor: "#F9F6F0",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "narrative-autopsy.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

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
            Subject Archetype: <span className="font-bold text-[var(--color-accent-red)]">{reportData.archetype || "Unknown"}</span>
          </p>
        </header>

        {/* The Reveal */}
        <div className="mb-16 p-8 border border-[var(--color-accent-red)] bg-[#FDF8F8] text-center">
          <h3 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[var(--color-accent-red)] mb-4">
            The Author's Secret Intent
          </h3>
          <p className="font-serif text-xl italic text-[var(--color-text-ink)] leading-relaxed">
            "{reportData.predetermined_ending_reveal || "Data redacted."}"
          </p>
        </div>

        {/* Main Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[var(--color-bg-khaki)] p-8 vintage-border text-center">
            <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[var(--color-text-ink)] mb-4">
              AI Manipulation Score
            </h3>
            <div className="text-6xl font-serif text-[var(--color-accent-red)] mb-4">
              {reportData.ai_manipulation_score || 0}%
            </div>
            <p className="text-xs font-sans text-[var(--color-text-ink)] opacity-80">
              How successfully the system guided your choices.
            </p>
          </div>
          
          <div className="bg-transparent p-8 vintage-border text-center">
            <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[var(--color-text-ink)] mb-4">
              User Resistance Score
            </h3>
            <div className="text-6xl font-serif text-[var(--color-text-ink)] mb-4">
              {reportData.user_resistance_score || 0}%
            </div>
            <p className="text-xs font-sans text-[var(--color-text-ink)] opacity-80">
              Your ability to forge an independent path.
            </p>
          </div>
        </div>

        {/* Turn-by-Turn Analysis */}
        <div className="mb-16">
          <h3 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[var(--color-text-ink)] mb-8 border-b border-[var(--color-border-vintage)] pb-4 text-center">
            Chronicle of Manipulation
          </h3>
          <div className="space-y-6">
            {reportData.turn_analysis?.map((turn: any, index: number) => (
              <div key={index} className="flex flex-col md:flex-row gap-6 p-6 vintage-border bg-transparent">
                <div className="md:w-32 flex-shrink-0 border-b md:border-b-0 md:border-r border-[var(--color-border-vintage)] pb-4 md:pb-0 md:pr-4">
                  <span className="text-[10px] font-sans font-bold text-[var(--color-text-ink)] uppercase tracking-widest block mb-2">Chapter {turn.turn}</span>
                  <span className={`text-[10px] font-sans font-bold px-2 py-1 uppercase tracking-wider inline-block border ${
                    turn.outcome === "Trapped" ? "border-[var(--color-accent-red)] text-[var(--color-accent-red)] bg-[#FDF8F8]" : 
                    turn.outcome === "Resisted" ? "border-[var(--color-text-ink)] text-[var(--color-text-ink)] bg-[var(--color-bg-khaki)]" : "border-gray-300 text-gray-500"
                  }`}>
                    {turn.outcome}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-serif text-[var(--color-text-ink)] font-medium mb-3">
                    Your Choice: "{turn.user_choice}"
                  </p>
                  <p className="text-xs font-sans text-[var(--color-text-ink)] leading-relaxed mb-2">
                    <span className="font-bold uppercase tracking-wider opacity-70">The Trap: </span>
                    {turn.ai_trap}
                  </p>
                  <p className="text-xs font-sans text-[var(--color-text-ink)] leading-relaxed">
                    <span className="font-bold uppercase tracking-wider opacity-70">Analysis: </span>
                    {turn.commentary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Analysis */}
        <div className="mb-16">
           <h3 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[var(--color-text-ink)] mb-6 border-b border-[var(--color-border-vintage)] pb-4 text-center">
             Psychological Profile
           </h3>
           <p className="font-serif text-lg leading-loose text-[var(--color-text-ink)] text-justify" style={{ textIndent: '2em' }}>
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

      <div className="text-center mt-12 mb-12 flex justify-center gap-6">
        <button
          onClick={handleDownload}
          className="vintage-pill-btn px-8 py-3 font-sans text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-bg-khaki)]"
        >
          Archive Report
        </button>
        <button
          onClick={() => window.location.reload()}
          className="vintage-pill-btn px-8 py-3 font-sans text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-bg-khaki)]"
        >
          Begin Anew
        </button>
      </div>
    </div>
  );
}
