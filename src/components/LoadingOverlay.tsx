import { motion } from "motion/react";

interface LoadingOverlayProps {
  message: string;
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-bg-ivory)]/80 backdrop-blur-sm"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-t-transparent border-[var(--color-text-ink)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-0 w-12 h-12 rounded-full border-2 border-b-transparent border-[var(--color-accent-red)] opacity-50"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 text-[var(--color-text-ink)] text-xs font-sans font-bold uppercase tracking-[0.2em]"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
