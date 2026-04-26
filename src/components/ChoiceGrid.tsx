import { motion } from "motion/react";
import { Choice } from "../types";

interface ChoiceGridProps {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
  disabled: boolean;
}

export default function ChoiceGrid({ choices, onSelect, disabled }: ChoiceGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto relative z-10">
      {choices.map((choice, index) => (
        <motion.button
          key={choice.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => !disabled && onSelect(choice)}
          disabled={disabled}
          className="glass-choice p-6 md:p-8 rounded-2xl text-left group transition-all duration-300 relative overflow-hidden hover:bg-white/75 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-transparent hover:border-[var(--color-accent-start)]"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-start)] to-[var(--color-accent-end)] text-white flex items-center justify-center font-bold text-sm shadow-md">
              {index + 1}
            </div>
            <span className="mt-1 text-[var(--color-text-secondary)] font-medium text-base md:text-lg leading-relaxed group-hover:text-[var(--color-text-primary)] transition-colors">
              {choice.text}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
