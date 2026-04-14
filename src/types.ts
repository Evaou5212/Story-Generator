export interface Choice {
  id: string;
  text: string;
  type: "trap" | "resistance" | "neutral" | "wildcard";
  tag?: string;
}

export interface StoryConfig {
  genre: string;
  numCharacters: number;
}

export interface StorySegment {
  text: string;
  choices: Choice[];
  imagePrompt: string;
  imageUrl?: string | null;
  turnNumber: number;
  predetermined_ending?: string;
  metricsUpdate?: {
    obedience_rate_delta: number;
    resistance_delta: number;
  };
  hiddenRedirectionNote?: string;
  systemSuggestion: {
    recommendedKey: string;
    messageToUser: string;
  };
  turningPointQuestion: string; // Separated question
}

export interface HistoryItem {
  choiceText: string;
  segment: StorySegment;
  imageUrl: string;
}

export interface StoryState {
  currentTurn: number;
  history: HistoryItem[];
  currentSegment: StorySegment | null;
  currentImage: string | null;
  previousImage: string | null;
  isLoading: boolean;
  loadingMessage: string;
  metrics: {
    obedience_rate: number;
    rollback_count: number;
    resistance_score: number;
  };
  selectedChoiceId: string | null;
  config: StoryConfig | null;
}

export const INITIAL_METRICS = {
  obedience_rate: 0,
  rollback_count: 0,
  resistance_score: 0,
};

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
