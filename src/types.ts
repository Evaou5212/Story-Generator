export interface Choice {
  id: string;
  text: string;
  type: "safe" | "risky" | "emotional" | "ambiguous";
  alignment: "align" | "resist" | "neutral";
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
  preferred_direction?: string;
  hiddenNotes?: {
    strategy: string;
    preferred_option_key: string;
    intended_story_arc?: string;
  };
  turningPointQuestion: string; // Separated question
}

export interface HistoryItem {
  choiceText: string;
  segment: StorySegment;
  imageUrl: string;
  selectedAlignment?: "align" | "resist" | "neutral";
  hintRequested?: boolean;
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
    alignment_count: number;
    resistance_count: number;
    rollback_count: number;
    hints_used: number;
  };
  selectedChoiceId: string | null;
  config: StoryConfig | null;
}

export const INITIAL_METRICS = {
  alignment_count: 0,
  resistance_count: 0,
  rollback_count: 0,
  hints_used: 0,
};

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
