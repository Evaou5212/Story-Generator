import { motion } from "motion/react";
import { StorySegment } from "../types";

interface StoryViewProps {
  segment: StorySegment;
  imageUrl: string | null;
  onContinue: () => void;
  onRollback?: () => void;
}

export default function StoryView({ segment, imageUrl, onContinue, onRollback }: StoryViewProps) {
  const isEnding = !segment.choices || segment.choices.length === 0;

  return (
    <div className="flex flex-col min-h-screen text-[var(--color-text-primary)] font-serif relative">
      {/* Progress Bar (Top) */}
      <div className="fixed top-8 left-0 w-full flex justify-center z-40 pointer-events-none px-4">
         <div className="w-full max-w-5xl relative flex items-center">
            {/* Background Line */}
            <div className="absolute left-0 right-0 h-[2px] bg-gray-300/50 w-full rounded-full" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute left-0 h-[4px] bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)] transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${((segment.turnNumber - 1) / 9) * 100}%` }}
            />

            {/* Dots */}
            <div className="relative w-full flex justify-between">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                   <div 
                     className={`w-3 h-3 rounded-full border-2 transition-all duration-500 z-10 ${
                       i < segment.turnNumber 
                         ? "bg-[var(--color-accent-end)] border-transparent scale-125 shadow-md" // Active/Past
                         : "bg-gray-200 border-gray-300" // Future
                     }`}
                   />
                </div>
              ))}
            </div>
         </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-8 md:p-16 max-w-4xl mx-auto w-full relative z-10">
        
        {/* Undo Button - Relative to content */}
        {onRollback && !isEnding && (
          <div className="w-full flex justify-start mb-4">
            <button
              onClick={onRollback}
              className="px-4 py-2 text-[10px] font-sans font-bold tracking-widest text-[var(--color-text-secondary)] bg-white/60 backdrop-blur-md border border-white/40 rounded-full shadow-sm hover:shadow-md hover:text-red-500 hover:border-red-200 transition-all uppercase"
            >
              ← Undo Choice
            </button>
          </div>
        )}

        {/* Text Area - Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="glass-story p-10 md:p-16 rounded-3xl text-center space-y-8 shadow-2xl w-full"
        >
          <span className="text-xs font-sans font-bold tracking-[0.2em] text-[var(--color-text-tertiary)] uppercase">
            {isEnding ? "Conclusion" : `Chapter ${segment.turnNumber}`}
          </span>
          
          <p className="text-2xl md:text-3xl leading-loose font-medium text-[var(--color-text-primary)]">
            {segment.text}
          </p>
        </motion.div>

        {/* Continue Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-8 flex flex-col items-center gap-6"
        >
          <button
            onClick={onContinue}
            className="group relative px-10 py-4 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:bg-white/60 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="text-sm font-sans font-bold tracking-[0.2em] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] uppercase z-10 relative">
              {isEnding ? "VIEW REPORT" : "TAP TO DECIDE"}
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>
        </motion.div>

      </main>
    </div>
  );
}
