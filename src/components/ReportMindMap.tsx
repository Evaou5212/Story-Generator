import { useState } from "react";
import { StoryState } from "../types";

interface ReportMindMapProps {
  state: StoryState;
}

export default function ReportMindMap({ state }: ReportMindMapProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  return (
    <div className="my-16 pb-16 relative">
      <h3 className="text-2xl font-serif text-[var(--color-text-ink)] mb-12 text-center uppercase tracking-widest">
        Divergence Map
      </h3>

      <div className="relative max-w-5xl mx-auto py-8">
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[var(--color-border-vintage)] -translate-x-1/2 z-0"></div>

        {state.history.map((historyItem, index) => {
          if (
            !historyItem.segment.choices ||
            historyItem.segment.choices.length === 0
          )
            return null;

          const preferredKey =
            historyItem.segment.hiddenNotes?.preferred_option_key;
          const preferredChoice =
            historyItem.segment.choices.find((c) => c.id === preferredKey) ||
            null;

          const isAlignment =
            preferredChoice && preferredChoice.text === historyItem.choiceText;

          const nextSegment = state.history[index + 1]?.segment;
          const userOutcome = nextSegment
            ? nextSegment.text
            : "The story concluded based on this choice.";
          
          const isHovered = hoveredNode === index;

          return (
            <div
              key={index}
              className={`relative flex justify-between items-center mb-32 w-full z-10 ${isHovered ? "z-50" : ""}`}
              onMouseEnter={() => setHoveredNode(index)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* AI Side (Left) */}
              <div
                className="w-5/12 flex justify-end pr-12 relative group"
              >
                <div className={`p-6 border border-[var(--color-accent-red)] flex flex-col justify-between w-full max-w-sm transition-all duration-300 bg-[#FDF8F8] shadow-sm transform-gpu group-hover:shadow-md group-hover:scale-[1.02]`}>
                  <div>
                    <p className="text-[10px] font-sans font-bold text-[var(--color-accent-red)] uppercase tracking-wider mb-3">
                      Turn {index + 1}: Engine Intent
                    </p>
                    <p
                      className="font-serif text-base text-[var(--color-text-ink)] mb-0"
                    >
                      {preferredChoice
                        ? preferredChoice.text
                        : "AI Direction unknown."}
                    </p>
                  </div>

                  {/* Absolute positioning popup for details on hover */}
                  <div className="absolute top-full right-12 mt-4 w-full max-w-md pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 transform-gpu translate-y-2 group-hover:translate-y-0">
                    <div className="bg-[#FDF8F8] border border-[var(--color-accent-red)] p-6 shadow-xl relative">
                      {/* Arrow */}
                      <div className="absolute -top-2 right-12 w-4 h-4 bg-[#FDF8F8] border-t border-l border-[var(--color-accent-red)] transform rotate-45"></div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest mb-2 text-[var(--color-accent-red)] relative z-10">
                        Author's Strategy
                      </h4>
                      <p className="font-serif text-sm leading-relaxed text-[var(--color-text-ink)] italic relative z-10">
                        {historyItem.segment.hiddenNotes?.strategy ||
                          "No specific strategy listed."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Node */}
              <div className={`absolute left-1/2 w-8 h-8 rounded-full border-2 transition-all duration-300 -translate-x-1/2 flex items-center justify-center z-20 shadow-sm ${isHovered ? "border-[var(--color-text-ink)] bg-[var(--color-text-ink)] scale-125" : "bg-[var(--color-bg-ivory)] border-[var(--color-text-ink)]"} cursor-default pointer-events-none`}>
                <span className={`text-[10px] font-bold font-sans ${isHovered ? "text-[var(--color-bg-ivory)]" : "text-[var(--color-text-ink)]"}`}>
                  {index + 1}
                </span>
                {isAlignment && (
                  <div className={`absolute -right-1 -top-1 w-3 h-3 rounded-full border border-white ${isHovered ? "bg-[#ffcccc]" : "bg-[var(--color-accent-red)]"}`}></div>
                )}
              </div>

              {/* User Side (Right) */}
              <div
                className="w-5/12 pl-12 relative group"
              >
                <div
                  className={`p-6 border flex flex-col justify-between h-full w-full max-w-sm transition-all duration-300 ${isAlignment ? "border-[var(--color-accent-red)] bg-[#FDF8F8]" : "border-[var(--color-text-ink)] bg-[var(--color-bg-ivory)]"} shadow-sm transform-gpu group-hover:shadow-md group-hover:scale-[1.02]`}
                >
                  <div>
                    <p
                      className={`text-[10px] font-sans font-bold uppercase tracking-wider mb-3 ${isAlignment ? "text-[var(--color-accent-red)]" : "text-[var(--color-text-ink)]"}`}
                    >
                      Turn {index + 1}: Your Reality
                    </p>
                    <p
                      className="font-serif text-base text-[var(--color-text-ink)] mb-0"
                    >
                      {historyItem.choiceText}
                    </p>
                  </div>

                  {/* Absolute positioning popup for details on hover */}
                  <div className="absolute top-full left-12 mt-4 w-full max-w-md pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 transform-gpu translate-y-2 group-hover:translate-y-0">
                    <div className={`border p-6 shadow-xl relative ${isAlignment ? "bg-[#FDF8F8] border-[var(--color-accent-red)]" : "bg-[var(--color-bg-ivory)] border-[var(--color-text-ink)]"}`}>
                      {/* Arrow */}
                      <div className={`absolute -top-2 left-12 w-4 h-4 border-t border-l transform rotate-45 ${isAlignment ? "bg-[#FDF8F8] border-[var(--color-accent-red)]" : "bg-[var(--color-bg-ivory)] border-[var(--color-text-ink)]"}`}></div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest mb-2 opacity-70 relative z-10">
                        The Resulting Path
                      </h4>
                      <p className="font-serif text-sm leading-relaxed text-[var(--color-text-ink)] italic relative z-10">
                        {userOutcome}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
