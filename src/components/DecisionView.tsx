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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-xl -z-10"></div>
      
      <div className="w-full max-w-3xl relative z-10">
        
        {/* Undo Button - Relative to content */}
        {onRollback && (
          <div className="w-full flex justify-start mb-4">
            <button
              onClick={onRollback}
              className="px-4 py-2 text-[10px] font-sans font-bold tracking-widest text-[var(--color-text-secondary)] bg-white/60 backdrop-blur-md border border-white/40 rounded-full shadow-sm hover:shadow-md hover:text-red-500 hover:border-red-200 transition-all uppercase"
            >
              ← Undo Choice
            </button>
          </div>
        )}

        {/* AI Suggestion / Feedback */}
        {segment.systemSuggestion && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 glass-header rounded-xl border-l-4 border-[var(--color-accent-start)] font-mono text-sm text-[var(--color-text-secondary)] shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-accent-end)]">
              <span className="w-2 h-2 bg-[var(--color-accent-end)] rounded-full animate-pulse"></span>
              Narrative Guidance Engine
            </div>
            <p className="leading-relaxed italic">
              "{segment.systemSuggestion.messageToUser}"
            </p>
          </motion.div>
        )}

        {/* Question */}
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-[var(--color-text-primary)] mb-6 leading-tight">
            {segment.turningPointQuestion}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)] mx-auto rounded-full"></div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr">
          {segment.choices.map((choice, index) => (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(choice)}
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderColor: "var(--color-accent-start)",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)"
              }}
              whileTap={{ scale: 0.98 }}
              className="group glass-choice p-6 md:p-8 rounded-2xl text-left transition-all duration-300 h-full flex flex-col justify-center relative overflow-hidden"
            >
              <div className="flex items-start gap-4 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-start)] to-[var(--color-accent-end)] text-white flex items-center justify-center font-bold text-sm shadow-md mt-1">
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <span className="text-lg font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors block mb-2">
                    {choice.text}
                  </span>
                  {choice.tag && (
                     <span className="inline-block px-2 py-1 bg-[var(--color-accent-start)]/10 text-[var(--color-accent-end)] text-xs font-bold uppercase tracking-wider rounded-md">
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
            className="text-xs font-bold tracking-[0.2em] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] uppercase transition-colors"
          >
            ← Return to Narrative
          </button>
        </div>

      </div>
    </div>
  );
}
