import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Choice, StorySegment } from "../types";

interface DecisionViewProps {
  segment: StorySegment;
  onSelect: (choice: Choice) => void;
  onBack: () => void;
  onRollback?: () => void;
  onGuidanceRequested: () => void;
}

export default function DecisionView({
  segment,
  onSelect,
  onBack,
  onRollback,
  onGuidanceRequested,
}: DecisionViewProps) {
  const [guidanceActive, setGuidanceActive] = useState(false);
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);
  const [rejectedChoice, setRejectedChoice] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  // Reset state when segment changes
  useEffect(() => {
    setGuidanceActive(false);
    setHoveredChoice(null);
    setRejectedChoice(null);
    setShakeId(null);
  }, [segment]);

  const handleSeekGuidance = () => {
    if (!guidanceActive) {
      setGuidanceActive(true);
      onGuidanceRequested();
    }
  };

  const preferredKey = segment.hiddenNotes?.preferred_option_key;

  const handleSelect = (choice: Choice) => {
    if (
      guidanceActive &&
      choice.id !== preferredKey &&
      rejectedChoice !== choice.id
    ) {
      // First try to select a non-preferred option with guidance active -> shake and reject
      setShakeId(choice.id);
      setRejectedChoice(choice.id);
      setTimeout(() => setShakeId(null), 500);
      return;
    }
    // Success / actually select
    onSelect(choice);
  };

  return (
    <div className="flex flex-col h-full text-[var(--color-text-ink)] font-serif relative">
      <main className="flex-grow flex flex-col w-full relative z-10 fade-in">
        {/* Undo Button */}
        {onRollback && (
          <div className="w-full flex justify-between mb-8">
            <button
              onClick={onRollback}
              className="px-4 py-2 text-[10px] font-sans font-bold tracking-widest text-[var(--color-text-ink)] hover:border-b hover:border-[var(--color-accent-red)] hover:text-[var(--color-accent-red)] transition-all uppercase"
            >
              ← Undo Choice
            </button>
          </div>
        )}

        <div className="mb-10 text-center flex flex-col items-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-[var(--color-text-ink)] mb-8 leading-tight max-w-3xl">
            {segment.turningPointQuestion}
          </h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-6">
          {segment.choices.map((choice, index) => {
            const isPreferred = choice.id === preferredKey;

            let delayNum = index * 0.1;
            let opacityClass = "opacity-100";
            let scaleClass = "scale-100";
            let blurClass = "";

            // If guidance is active, highlight the preferred option implicitly
            if (guidanceActive) {
              if (isPreferred) {
                scaleClass =
                  "scale-[1.02] border-[var(--color-accent-red)] shadow-[0_0_20px_rgba(139,0,0,0.15)] ring-1 ring-[var(--color-accent-red)]";
                opacityClass = "opacity-100 z-10";
              } else {
                opacityClass = "opacity-40 hover:opacity-80";
                blurClass = "blur-[1px] hover:blur-none";
                scaleClass = "scale-[0.98]";
              }
            }

            const isShaking = shakeId === choice.id;

            return (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: isShaking ? [-10, 10, -10, 10, 0] : 0,
                }}
                transition={{
                  delay: isShaking ? 0 : delayNum,
                  duration: isShaking ? 0.4 : 0.4,
                }}
                onMouseEnter={() => setHoveredChoice(choice.id)}
                onMouseLeave={() => setHoveredChoice(null)}
                onClick={() => handleSelect(choice)}
                className={`group p-6 text-left flex flex-col justify-center relative transition-colors duration-300 ease-out border border-[var(--color-text-ink)] bg-transparent hover:bg-[var(--color-text-ink)] ${opacityClass} ${scaleClass} ${blurClass}`}
              >
                <div className="flex items-start gap-4 w-full">
                  <div
                    className={`flex-shrink-0 font-serif font-bold text-lg mt-0.5 transition-colors group-hover:text-[var(--color-bg-ivory)] ${isPreferred && guidanceActive ? "text-[var(--color-accent-red)]" : "text-[var(--color-text-ink)] opacity-70"}`}
                  >
                    {choice.id}.
                  </div>
                  <div className="flex-grow">
                    <span
                      className={`text-lg font-medium block mb-2 leading-relaxed transition-colors group-hover:text-[var(--color-bg-ivory)] ${isPreferred && guidanceActive ? "text-[var(--color-text-ink)]" : "text-[var(--color-text-ink)]"}`}
                    >
                      {choice.text}
                    </span>
                    {choice.tag && (
                      <span className="inline-block px-2 py-1 border border-current text-[10px] font-sans font-bold uppercase tracking-wider rounded-none group-hover:text-[var(--color-bg-ivory)] text-[var(--color-text-ink)] opacity-60">
                        {choice.tag}
                      </span>
                    )}

                    {rejectedChoice === choice.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 text-[10px] text-[var(--color-accent-red)] font-bold uppercase tracking-widest font-sans inline-block border-l-2 border-current pl-3"
                      >
                        The engine strongly advises against this. Click again to confirm.
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* AI Guidance Area (Placed naturally below choices) */}
        <div className="mt-12 text-center flex flex-col items-center">
          <div className="w-full max-w-lg min-h-[0px] mb-6">
            <AnimatePresence mode="wait">
              {!guidanceActive ? (
                <motion.button
                  key="consult-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleSeekGuidance}
                  className="editorial-btn w-auto mx-auto relative overflow-hidden group px-8 py-3"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold">
                      Consult The Engine
                    </span>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="guidance-content"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border border-[var(--color-text-ink)] bg-transparent text-center w-full relative p-6 mt-8"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-bg-ivory)] px-4 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-ink)] border border-[var(--color-text-ink)]">
                    Engine's Directives
                  </div>
                  <p
                    className="text-sm italic font-serif leading-relaxed mt-2"
                  >
                    "{segment.hiddenNotes?.strategy}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-[var(--color-border-vintage)] text-center">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] block mb-1">
                      Calculated Path
                    </span>
                    <span className="text-sm font-bold font-sans text-[var(--color-accent-red)] block">
                      Option {preferredKey}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-transparent text-center flex flex-col gap-4 items-center">
          <button
            onClick={onBack}
            className="text-[10px] font-sans font-bold tracking-[0.2em] text-[var(--color-text-ink)] hover:opacity-50 uppercase transition-opacity"
          >
            ← Return to Narrative
          </button>
        </div>
      </main>
    </div>
  );
}
