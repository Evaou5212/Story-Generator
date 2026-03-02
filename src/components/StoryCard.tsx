import { motion } from "motion/react";

interface StoryCardProps {
  text: string;
}

export default function StoryCard({ text }: StoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="glass-story p-8 md:p-16 rounded-2xl max-w-3xl mx-auto mb-10 text-center relative z-10"
    >
      <p className="font-serif text-xl md:text-2xl leading-loose tracking-wide text-[var(--color-text-primary)]">
        {text}
      </p>
    </motion.div>
  );
}
