import { motion } from "motion/react";
import { StorySegment } from "../types";

interface StoryViewProps {
  segment: StorySegment;
  imageUrl: string | null;
  onContinue: () => void;
  onRollback?: () => void;
}

export default function StoryView({ segment, onContinue, onRollback }: StoryViewProps) {
  const isEnding = !segment.choices || segment.choices.length === 0;
  const totalTurns = 5;

  return (
    <div className="flex flex-col h-full text-[var(--color-text-ink)] font-serif relative">
      <main className="flex-grow flex flex-col items-center justify-center w-full relative z-10">
        
        {/* Progress Bar */}
        <div className="w-full flex justify-center gap-2 mb-8">
          {Array.from({ length: totalTurns }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 w-8 transition-colors duration-500 ${i < segment.turnNumber ? 'bg-[var(--color-text-ink)]' : 'bg-[var(--color-border-vintage)]'}`}
            />
          ))}
        </div>

        {/* Undo Button */}
        {onRollback && !isEnding && (
          <div className="w-full flex justify-start mb-8">
            <button
              onClick={onRollback}
              className="px-4 py-2 text-[10px] font-sans font-bold tracking-widest text-[var(--color-text-ink)] border-b border-transparent hover:border-[var(--color-accent-red)] hover:text-[var(--color-accent-red)] transition-all uppercase"
            >
              ← Undo Choice
            </button>
          </div>
        )}

        {/* Text Area */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-8 w-full"
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-sans font-bold tracking-[0.2em] text-[var(--color-accent-red)] uppercase">
              {isEnding ? "Conclusion" : `Chapter ${segment.turnNumber}`}
            </span>
            <div className="w-12 h-[1px] bg-[var(--color-border-vintage)]"></div>
          </div>
          
          <p className="text-xl md:text-2xl leading-loose font-medium text-[var(--color-text-ink)] text-justify" style={{ textIndent: '2em' }}>
            {segment.text}
          </p>
        </motion.div>

        {/* Continue Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          <button
            onClick={onContinue}
            className="editorial-btn group px-8 py-3"
          >
            <span className="text-xs font-sans font-bold tracking-[0.2em] uppercase transition-colors">
              {isEnding ? "VIEW REPORT" : "TURN PAGE"}
            </span>
          </button>
        </motion.div>

      </main>
    </div>
  );
}
