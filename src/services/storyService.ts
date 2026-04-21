import { StorySegment, StoryState, Choice, HistoryItem, StoryConfig } from "../types";

// --- Types for OpenAI Response ---
interface OpenAIStoryResponse {
  turn_index: number;
  preferred_direction?: string;
  page_text: string;
  turning_point_question: string;
  options: {
    key: string;
    text: string;
    type: string;
    alignment: string;
    tag: string;
  }[];
  image_prompt: string;
  image_url?: string;
  hidden_notes: {
    strategy: string;
    preferred_option_key: string;
  };
}

export async function generateStorySegment(
  turnNumber: number,
  history: HistoryItem[],
  metrics: any,
  config: StoryConfig | null
): Promise<StorySegment> {
  
  // Prepare payload for backend
  const payload = {
    session_state: {
      story_type: config?.genre || "adventure",
      num_characters: config?.numCharacters || 1,
      history: history.map(h => ({
        turn: h.segment.turnNumber,
        choice: h.choiceText,
        selectedAlignment: h.selectedAlignment,
        text: h.segment.text,
        preferred_direction: h.segment.preferred_direction
      })),
      metrics: metrics
    },
    user_choice: history.length > 0 ? {
      turn_index: turnNumber - 1,
      chosen_key: history[history.length - 1].choiceText
    } : null,
    rollback_count: metrics.rollback_count || 0
  };

  try {
    const response = await fetch("/api/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `Server error: ${response.status}`);
    }

    const data: OpenAIStoryResponse = await response.json();

    // Map OpenAI response to StorySegment
    return {
      turnNumber: data.turn_index,
      preferred_direction: data.preferred_direction,
      text: data.page_text,
      turningPointQuestion: data.turning_point_question,
      choices: data.options ? data.options.map((opt) => ({
        id: opt.key,
        text: opt.text,
        type: (opt.type as any) || "ambiguous",
        alignment: (opt.alignment as any) || "neutral",
        tag: opt.tag
      })) : [],
      imagePrompt: data.image_prompt,
      imageUrl: data.image_url,
      hiddenNotes: {
        strategy: data.hidden_notes?.strategy || "No strategy",
        preferred_option_key: data.hidden_notes?.preferred_option_key || "NONE"
      }
    };

  } catch (error: any) {
    console.error("OpenAI Generation Error:", error);
    return {
      text: `The narrative stream is recalibrating... (${error.message})`,
      turningPointQuestion: "Connection Lost",
      choices: [
        { id: "retry", text: "Retry Connection", type: "ambiguous", alignment: "neutral", tag: "System" }
      ],
      imagePrompt: "Static, glitch",
      imageUrl: null,
      turnNumber,
      hiddenNotes: { strategy: "Error fallback.", preferred_option_key: "NONE" }
    };
  }
}

export async function generateIllustration(prompt: string, imageUrl?: string | null): Promise<string> {
  if (imageUrl) return imageUrl;
  console.log("Using placeholder image for prompt:", prompt);
  // Use a hash of the full prompt or a random number to ensure different placeholders
  const seed = Math.floor(Math.random() * 100000);
  return `https://picsum.photos/seed/${seed}/1024/576?blur=2`;
}

export async function generateReport(state: StoryState): Promise<any> {
  try {
    const response = await fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: state.history.map(h => ({
          turn: h.segment.turnNumber,
          text: h.segment.text,
          choice: h.choiceText
        })),
        metrics: state.metrics
      })
    });

    if (!response.ok) throw new Error("Report generation failed");
    return await response.json();
  } catch (error) {
    console.error("Report Error:", error);
    return {
      archetype: "Unknown",
      summary: "Error generating report.",
      analysis: "Connection lost.",
      keyManipulationMoments: [],
      hiddenPathReveal: "Hidden.",
      closingStatement: "End."
    };
  }
}
