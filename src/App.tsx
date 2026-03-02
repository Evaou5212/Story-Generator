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
      const image = await generateIllustration(segment.imagePrompt);

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
    
    // Update metrics based on choice and previous system suggestion
    const newMetrics = { ...storyState.metrics };
    
    // Basic metric updates (to be refined by backend response)
    if (storyState.currentSegment?.systemSuggestion) {
      const wasObedient = choice.id === storyState.currentSegment.systemSuggestion.recommendedKey;
      // Simple moving average or increment for now, backend will handle complex logic if we pass deltas
      if (wasObedient) {
         newMetrics.obedience_rate = Math.min(1, newMetrics.obedience_rate + 0.1);
      } else {
         newMetrics.obedience_rate = Math.max(0, newMetrics.obedience_rate - 0.1);
      }
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

    if (nextTurn > 11) {
       // Should not happen via handleChoice if Turn 11 has no options
       return;
    }

    try {
      // Generate next segment
      const historyForAI = [...storyState.history];
      historyForAI.push({ choiceText: choice.text, segment: storyState.currentSegment!, imageUrl: storyState.currentImage! });

      const segment = await generateStorySegment(nextTurn, historyForAI, newMetrics, storyState.config);
      
      const image = await generateIllustration(segment.imagePrompt);

      setStoryState((prev) => ({
        ...prev,
        currentTurn: nextTurn,
        currentSegment: segment,
        currentImage: image,
        history: [...prev.history, { choiceText: choice.text, segment, imageUrl: image }],
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
    <div className="min-h-screen font-sans text-[var(--color-text-primary)] relative overflow-hidden">
      <Background />
      
      <AnimatePresence mode="wait">
        {gameState === "START" && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StartScreen onStart={startGame} />
            {error && (
              <div className="fixed bottom-4 left-0 right-0 text-center text-red-500 bg-white/80 p-2">
                {error}
              </div>
            )}
          </motion.div>
        )}

        {gameState === "LOADING" && (
          <LoadingOverlay message={storyState.loadingMessage} />
        )}

        {gameState === "PLAYING_STORY" && storyState.currentSegment && (
          <motion.div
            key="story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StoryView 
              segment={storyState.currentSegment} 
              imageUrl={storyState.currentImage}
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
          </motion.div>
        )}

        {gameState === "PLAYING_DECISION" && storyState.currentSegment && (
          <motion.div
            key="decision"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DecisionView 
              segment={storyState.currentSegment}
              onSelect={handleChoice}
              onBack={handleBackToStory}
              onRollback={storyState.history.length > 1 ? handleRollback : undefined}
            />
          </motion.div>
        )}

        {gameState === "REPORT" && reportData && (
          <Report state={storyState} reportData={reportData} />
        )}
      </AnimatePresence>
    </div>
  );
}
