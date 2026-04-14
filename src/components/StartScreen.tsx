import { useState } from "react";
import { motion } from "motion/react";
import { StoryConfig } from "../types";

interface StartScreenProps {
  onStart: (config: StoryConfig) => void;
}

const GENRES = [
  { id: "romance", label: "Romance" },
  { id: "scifi", label: "Sci-Fi" },
  { id: "adventure", label: "Adventure" },
  { id: "mystery", label: "Mystery" },
  { id: "fantasy", label: "Fantasy" },
];

export default function StartScreen({ onStart }: StartScreenProps) {
  const [genre, setGenre] = useState<string>("adventure");
  const [numCharacters, setNumCharacters] = useState<number>(1);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 font-serif text-[var(--color-text-ink)] bg-[#FFFDF9] vintage-border vintage-shadow">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-8 md:p-12"
      >
        
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight mb-6 text-[var(--color-text-ink)] uppercase">
            The Illusion of Choice
          </h1>
          <div className="w-24 h-[1px] bg-[var(--color-border-vintage)] mx-auto mb-6"></div>
          <p className="text-[var(--color-text-ink)] text-sm tracking-[0.2em] font-sans uppercase">
            An Interactive Narrative Experiment
          </p>
        </div>

        {/* Genre Section */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-[1px] w-12 bg-[var(--color-border-vintage)]"></span>
            <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-[var(--color-text-ink)]">Select Genre</span>
            <span className="h-[1px] w-12 bg-[var(--color-border-vintage)]"></span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenre(g.id)}
                className={`
                  relative h-24 flex flex-col items-center justify-center vintage-border transition-all duration-300
                  ${genre === g.id 
                    ? "bg-[var(--color-bg-khaki)] text-[var(--color-text-ink)] vintage-shadow scale-105" 
                    : "bg-transparent text-[var(--color-text-ink)] opacity-70 hover:opacity-100 hover:bg-[var(--color-bg-ivory)]"
                  }
                `}
              >
                <span className="font-serif text-lg italic">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Characters Section */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-[1px] w-12 bg-[var(--color-border-vintage)]"></span>
            <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-[var(--color-text-ink)]">Protagonists</span>
            <span className="h-[1px] w-12 bg-[var(--color-border-vintage)]"></span>
          </div>
          
          <div className="flex items-center justify-center gap-12">
            <button 
              onClick={() => setNumCharacters(Math.max(1, numCharacters - 1))}
              className="w-10 h-10 flex items-center justify-center vintage-border bg-transparent hover:bg-[var(--color-bg-khaki)] transition-colors text-xl text-[var(--color-text-ink)]"
            >
              −
            </button>
            <div className="font-serif text-5xl font-medium w-20 text-center text-[var(--color-text-ink)]">
              {numCharacters}
            </div>
            <button 
              onClick={() => setNumCharacters(Math.min(5, numCharacters + 1))}
              className="w-10 h-10 flex items-center justify-center vintage-border bg-transparent hover:bg-[var(--color-bg-khaki)] transition-colors text-xl text-[var(--color-text-ink)]"
            >
              +
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={() => onStart({ genre, numCharacters })}
            className="vintage-pill-btn px-12 py-4 text-xs font-sans font-bold tracking-[0.2em] uppercase hover:bg-[var(--color-bg-khaki)]"
          >
            <span className="relative z-10">Begin the Tale</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
