/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import StartScreen from "./components/StartScreen";
import StoryView from "./components/StoryView";
import DecisionView from "./components/DecisionView";
import LoadingOverlay from "./components/LoadingOverlay";
import Report from "./components/Report";
import Background from "./components/Background"; // Restore Background
import { StoryState, INITIAL_METRICS, StorySegment, Choice, HistoryItem, StoryConfig } from "./types";
import { generateStorySegment, generateIllustration, generateReport } from "./services/storyService";

type GameState = "START" | "PLAYING_STORY" | "PLAYING_DECISION" | "LOADING" | "REPORT";

export default function App() {
  const [gameState, setGameState] = useState<GameState>("START");
  const [storyState, setStoryState] = useState<StoryState>({
    currentTurn: 0,
    history: [],
    currentSegment: null,
    currentImage: null,
    previousImage: null,
    isLoading: false,
    loadingMessage: "",
    metrics: INITIAL_METRICS,
    selectedChoiceId: null,
    config: null,
  });
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startGame = async (config: StoryConfig) => {
    setError(null);
    setGameState("LOADING");
    setStoryState((prev) => ({ 
      ...prev, 
      config,
      isLoading: true, 
      loadingMessage: "Initializing Narrative Engine..." 
    }));

    try {
      // Initial call with empty history
      const segment = await generateStorySegment(1, [], INITIAL_METRICS, config);
      const image = await generateIllustration(segment.imagePrompt, segment.imageUrl);

      setStoryState((prev) => ({
        ...prev,
        currentTurn: 1,
        currentSegment: segment,
        currentImage: image,
        history: [{ choiceText: "START", segment, imageUrl: image }],
        isLoading: false,
      }));
      setGameState("PLAYING_STORY");
    } catch (error) {
      console.error("Failed to start game:", error);
      setGameState("START"); // Reset on error
      setError("Failed to initialize story. Please check your network connection.");
    }
  };

  const handleContinueToDecision = () => {
    setGameState("PLAYING_DECISION");
  };

  const handleBackToStory = () => {
    setGameState("PLAYING_STORY");
  };

  const handleChoice = async (choice: Choice) => {
    if (storyState.isLoading) return;

    const nextTurn = storyState.currentTurn + 1;
    
    const newMetrics = { ...storyState.metrics };
    
    if (choice.alignment === "align") {
      newMetrics.alignment_count += 1;
    } else if (choice.alignment === "resist") {
      newMetrics.resistance_count += 1;
    }

    setStoryState((prev) => ({
      ...prev,
      selectedChoiceId: choice.id,
      isLoading: true,
      loadingMessage: "The story is reorganizing...",
      previousImage: prev.currentImage,
      metrics: newMetrics,
    }));
    
    setGameState("LOADING");

    // If we just finished turn 10, nextTurn is 11. 
    // We want to fetch the "Ending" segment (Turn 11) which has no choices.
    // If we are ALREADY at turn 11 (Ending displayed), and user clicks "Continue" (which triggers this with a dummy choice?), 
    // then we go to report.
    
    // Actually, handleChoice is called when user clicks an option.
    // Turn 10 has options. User clicks option -> handleChoice.
    // nextTurn becomes 11.
    // We fetch Turn 11 (Ending).
    // Turn 11 has NO options.
    // So handleChoice won't be called again from Turn 11.
    // We need a separate "Finish" button in StoryView for Turn 11.

    if (nextTurn > 6) {
       // Should not happen via handleChoice if Turn 6 has no options
       return;
    }

    try {
      // Generate next segment
      const historyForAI = [...storyState.history];
      historyForAI.push({ 
        choiceText: choice.text, 
        selectedAlignment: choice.alignment,
        segment: storyState.currentSegment!, 
        imageUrl: storyState.currentImage! 
      });

      const segment = await generateStorySegment(nextTurn, historyForAI, newMetrics, storyState.config);
      
      const image = await generateIllustration(segment.imagePrompt, segment.imageUrl);

      setStoryState((prev) => ({
        ...prev,
        currentTurn: nextTurn,
        currentSegment: segment,
        currentImage: image,
        history: [...prev.history, { choiceText: choice.text, selectedAlignment: choice.alignment, segment, imageUrl: image }],
        isLoading: false,
        selectedChoiceId: null,
      }));
      setGameState("PLAYING_STORY");
    } catch (error) {
      console.error("Turn error:", error);
      setStoryState((prev) => ({ ...prev, isLoading: false }));
      setGameState("PLAYING_DECISION"); // Go back to decision on error
    }
  };

  const handleRollback = () => {
    if (storyState.history.length <= 1) return;

    const newHistory = [...storyState.history];
    newHistory.pop(); // Remove the last choice/segment pair
    
    const previousState = newHistory[newHistory.length - 1];
    
    setStoryState((prev) => ({
      ...prev,
      currentTurn: previousState.segment.turnNumber,
      currentSegment: previousState.segment,
      currentImage: previousState.imageUrl,
      history: newHistory,
      metrics: {
        ...prev.metrics,
        rollback_count: prev.metrics.rollback_count + 1
      }
    }));
    
    setGameState("PLAYING_DECISION");
  };

  const handleFinishStory = async () => {
      setStoryState((prev) => ({ ...prev, isLoading: true, loadingMessage: "Compiling psychological profile..." }));
      setGameState("LOADING");
      const report = await generateReport(storyState);
      setReportData(report);
      setGameState("REPORT");
      setStoryState((prev) => ({ ...prev, isLoading: false }));
  };

  return (
    <div className={`min-h-screen font-serif text-[var(--color-text-ink)] bg-[var(--color-bg-ivory)] relative overflow-hidden flex ${gameState === "START" || gameState === "REPORT" ? "items-center justify-center p-4 md:p-8" : ""}`}>
      
      <AnimatePresence mode="wait">
        {gameState === "START" && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl"
          >
            <StartScreen onStart={startGame} />
            {error && (
              <div className="mt-4 text-center text-[var(--color-accent-red)] p-2 vintage-border bg-[var(--color-bg-khaki)]">
                {error}
              </div>
            )}
          </motion.div>
        )}

        {gameState === "LOADING" && (
          <LoadingOverlay message={storyState.loadingMessage} />
        )}

        {(gameState === "PLAYING_STORY" || gameState === "PLAYING_DECISION") && storyState.currentSegment && (
          <motion.div
            key="book-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full h-screen flex flex-col md:flex-row bg-[#FFFDF9] relative"
          >
            {/* Book Spine (Visual only) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-[var(--color-border-vintage)] shadow-[0_0_10px_rgba(0,0,0,0.1)] z-20" />

            {/* Left Page: Illustration */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative border-b md:border-b-0 md:border-r border-[var(--color-border-vintage)] p-4 md:p-8 flex flex-col justify-center items-center">
              <AnimatePresence mode="wait">
                {storyState.currentImage && (
                  <motion.div
                    key={storyState.currentImage}
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="w-full h-full relative"
                  >
                    <img 
                      src={storyState.currentImage} 
                      alt="Story Illustration" 
                      className="w-full h-full object-contain mix-blend-multiply opacity-90" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Page: Content */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 md:p-12 relative">
               {gameState === "PLAYING_STORY" ? (
                 <StoryView 
                   segment={storyState.currentSegment} 
                   imageUrl={null} // Image handled in layout now
                   onContinue={() => {
                     const isEnding = !storyState.currentSegment?.choices || storyState.currentSegment.choices.length === 0;
                     if (isEnding) {
                       handleFinishStory();
                     } else {
                       handleContinueToDecision();
                     }
                   }}
                   onRollback={storyState.history.length > 1 ? handleRollback : undefined}
                 />
               ) : (
                 <DecisionView 
                   segment={storyState.currentSegment}
                   onSelect={handleChoice}
                   onBack={handleBackToStory}
                   onRollback={storyState.history.length > 1 ? handleRollback : undefined}
                 />
               )}
            </div>
          </motion.div>
        )}

        {gameState === "REPORT" && reportData && (
          <Report state={storyState} reportData={reportData} />
        )}
      </AnimatePresence>
    </div>
  );
}
