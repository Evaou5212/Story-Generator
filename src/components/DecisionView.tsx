import { motion } from "motion/react";
import { Choice, StorySegment } from "../types";

interface DecisionViewProps {
  segment: StorySegment;
  onSelect: (choice: Choice) => void;
  onBack: () => void;
  onRollback?: () => void;
}

export default function DecisionView({ segment, onSelect, onBack, onRollback }: DecisionViewProps) {
  return (
    <div className="flex flex-col h-full text-[var(--color-text-ink)] font-serif relative">
      <main className="flex-grow flex flex-col w-full relative z-10">
        
        {/* Undo Button */}
        {onRollback && (
          <div className="w-full flex justify-start mb-8">
            <button
              onClick={onRollback}
              className="px-4 py-2 text-[10px] font-sans font-bold tracking-widest text-[var(--color-text-ink)] border-b border-transparent hover:border-[var(--color-accent-red)] hover:text-[var(--color-accent-red)] transition-all uppercase"
            >
              ← Undo Choice
            </button>
          </div>
        )}

        {/* Question */}
        <div className="mb-10 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-[var(--color-text-ink)] mb-6 leading-tight">
            {segment.turningPointQuestion}
          </h2>
          <div className="w-16 h-[1px] bg-[var(--color-border-vintage)] mx-auto"></div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4">
          {segment.choices.map((choice, index) => (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(choice)}
              className="vintage-pill-btn group p-6 text-left flex flex-col justify-center relative hover:bg-[var(--color-bg-khaki)]"
            >
              <div className="flex items-start gap-4 w-full">
                <div className="flex-shrink-0 font-serif font-bold text-lg text-[var(--color-accent-red)] mt-0.5">
                  {String.fromCharCode(65 + index)}.
                </div>
                <div className="flex-grow">
                  <span className="text-lg font-medium text-[var(--color-text-ink)] block mb-2 leading-relaxed">
                    {choice.text}
                  </span>
                  {choice.tag && (
                     <span className="inline-block px-2 py-1 border border-[var(--color-border-vintage)] text-[var(--color-text-ink)] text-[10px] font-sans font-bold uppercase tracking-wider rounded-full">
                       {choice.tag}
                     </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center flex flex-col gap-4 items-center">
          <button 
            onClick={onBack}
            className="text-[10px] font-sans font-bold tracking-[0.2em] text-[var(--color-text-ink)] hover:text-[var(--color-accent-red)] uppercase transition-colors border-b border-transparent hover:border-[var(--color-accent-red)]"
          >
            ← Return to Narrative
          </button>
        </div>

      </main>
    </div>
  );
}
