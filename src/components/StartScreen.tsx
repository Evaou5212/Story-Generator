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
  const [genre, setGenre] = useState<string>("scifi");
  const [numCharacters, setNumCharacters] = useState<number>(1);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 font-sans text-[var(--color-text-primary)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl glass-story p-8 md:p-12 rounded-3xl shadow-2xl"
      >
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)]">
            Interactive Story
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg tracking-wide font-medium">
            Create Your Adventure
          </p>
        </div>

        {/* Genre Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="h-px w-8 bg-[var(--color-accent-start)]"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-text-tertiary)]">Genre</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenre(g.id)}
                className={`
                  relative h-32 flex flex-col items-center justify-center rounded-2xl border transition-all duration-300
                  ${genre === g.id 
                    ? "bg-gradient-to-br from-[var(--color-accent-start)] to-[var(--color-accent-end)] text-white border-transparent shadow-lg scale-105" 
                    : "glass-choice text-[var(--color-text-secondary)] border-white/40 hover:border-[var(--color-accent-start)] hover:text-[var(--color-text-primary)]"
                  }
                `}
              >
                <span className="font-serif text-xl italic">{g.label}</span>
                {genre === g.id && (
                  <motion.div 
                    layoutId="active-dot"
                    className="absolute bottom-4 w-1 h-1 bg-white rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Characters Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="h-px w-8 bg-[var(--color-accent-start)]"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-text-tertiary)]">Characters</span>
          </div>
          
          <div className="flex items-center justify-center gap-12">
            <button 
              onClick={() => setNumCharacters(Math.max(1, numCharacters - 1))}
              className="w-12 h-12 flex items-center justify-center rounded-full glass-choice hover:bg-white/60 transition-colors text-xl text-[var(--color-text-primary)]"
            >
              −
            </button>
            <div className="font-serif text-6xl font-light w-24 text-center text-[var(--color-text-primary)]">
              {numCharacters}
            </div>
            <button 
              onClick={() => setNumCharacters(Math.min(5, numCharacters + 1))}
              className="w-12 h-12 flex items-center justify-center rounded-full glass-choice hover:bg-white/60 transition-colors text-xl text-[var(--color-text-primary)]"
            >
              +
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={() => onStart({ genre, numCharacters })}
            className="group relative px-12 py-5 bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)] text-white rounded-full text-sm font-bold tracking-widest uppercase overflow-hidden transition-transform hover:scale-105 shadow-xl"
          >
            <span className="relative z-10">Start Story</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
