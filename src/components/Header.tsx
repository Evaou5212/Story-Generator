import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  turnNumber: number;
  totalTurns: number;
  onRollback?: () => void;
}

export default function Header({ turnNumber, totalTurns, onRollback }: HeaderProps) {
  const progress = (turnNumber / totalTurns) * 100;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-header px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onRollback && (
            <button 
              onClick={onRollback}
              className="p-2 rounded-full hover:bg-black/5 transition-colors text-[var(--color-text-secondary)]"
              aria-label="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--color-text-secondary)] hidden md:block">
            Narrative Guidance Engine
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
            SEQ {String(turnNumber).padStart(2, '0')} / {totalTurns}
          </span>
          <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[var(--color-accent2-start)] to-[var(--color-accent2-end)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
