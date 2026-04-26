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
              className="relative flex justify-between items-center mb-32 w-full z-10"
              onMouseEnter={() => setHoveredNode(index)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* AI Side (Left) */}
              <div
                className={`w-5/12 flex justify-end pr-12 relative transition-all duration-500 ease-out ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"}`}
              >
                <div className="bg-[#FDF8F8] p-6 border border-[var(--color-accent-red)] flex flex-col justify-between w-full max-w-sm shadow-md">
                  <div>
                    <p className="text-[10px] font-sans font-bold text-[var(--color-accent-red)] uppercase tracking-wider mb-3">
                      Turn {index + 1}: Engine Intent
                    </p>
                    <p
                      className="font-serif text-base text-justify text-[var(--color-text-ink)] mb-6"
                    >
                      {preferredChoice
                        ? preferredChoice.text
                        : "AI Direction unknown."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-accent-red)] border-opacity-30">
                    <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest mb-2 text-[var(--color-accent-red)]">
                      Author's Strategy
                    </h4>
                    <p className="font-serif text-xs leading-relaxed text-[var(--color-text-ink)] italic">
                      {historyItem.segment.hiddenNotes?.strategy ||
                        "No specific strategy listed."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Center Node */}
              <div className={`absolute left-1/2 w-10 h-10 rounded-full bg-[var(--color-bg-ivory)] border-2 cursor-pointer transition-all duration-300 -translate-x-1/2 flex items-center justify-center z-20 shadow-sm ${isHovered ? "border-[var(--color-text-ink)] bg-[var(--color-text-ink)] scale-110" : "border-[var(--color-text-ink)]"}`}>
                <span className={`text-xs font-bold font-sans ${isHovered ? "text-[var(--color-bg-ivory)]" : "text-[var(--color-text-ink)]"}`}>
                  {index + 1}
                </span>
                {isAlignment && (
                  <div className={`absolute -right-2 -top-2 w-4 h-4 rounded-full border border-white ${isHovered ? "bg-[#ffcccc]" : "bg-[var(--color-accent-red)]"}`}></div>
                )}
              </div>

              {/* User Side (Right) */}
              <div
                className={`w-5/12 pl-12 relative transition-all duration-500 ease-out ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"}`}
              >
                <div
                  className={`p-6 border flex flex-col justify-between h-full w-full max-w-sm shadow-md ${isAlignment ? "bg-[#FDF8F8] border-[var(--color-accent-red)]" : "bg-[var(--color-bg-ivory)] border-[var(--color-text-ink)]"}`}
                >
                  <div>
                    <p
                      className={`text-[10px] font-sans font-bold uppercase tracking-wider mb-3 ${isAlignment ? "text-[var(--color-accent-red)]" : "text-[var(--color-text-ink)]"}`}
                    >
                      Turn {index + 1}: Your Reality
                    </p>
                    <p
                      className="font-serif text-base text-justify text-[var(--color-text-ink)] mb-6"
                    >
                      {historyItem.choiceText}
                    </p>
                  </div>

                  <div className={`pt-4 border-t flex-grow flex flex-col justify-end ${isAlignment ? "border-[var(--color-accent-red)] border-opacity-30" : "border-[var(--color-text-ink)] border-opacity-30"}`}>
                    <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest mb-2 opacity-70">
                      The Resulting Path
                    </h4>
                    <p className="font-serif text-xs leading-relaxed text-[var(--color-text-ink)] italic line-clamp-3 hover:line-clamp-none">
                      {userOutcome}
                    </p>
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
