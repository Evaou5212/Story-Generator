export interface Choice {
  id: string;
  text: string;
  type: "safe" | "risky" | "emotional" | "mystery" | "neutral";
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
  metricsUpdate?: {
    narrativeControlDelta: number;
    systemInfluenceDelta: number;
    suggestionAcceptance: boolean;
    conflictAvoidance: boolean;
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
    decisiveness_score: number;
    risk_preference: number;
    emotion_preference: number;
    consistency_drive: number;
  };
  selectedChoiceId: string | null;
  config: StoryConfig | null;
}

export const INITIAL_METRICS = {
  obedience_rate: 0,
  rollback_count: 0,
  decisiveness_score: 0,
  risk_preference: 0,
  emotion_preference: 0,
  consistency_drive: 0,
};

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
