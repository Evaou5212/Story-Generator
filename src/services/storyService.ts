import { StorySegment, StoryState, Choice, HistoryItem, StoryConfig } from "../types";
import { GoogleGenAI, Type } from "@google/genai";
import { GENERAL_PROMPT, GENRE_PROMPTS } from "../prompts";

const ai = new GoogleGenAI({
  apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY
});

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    turn_index: { type: Type.INTEGER },
    preferred_direction: { type: Type.STRING, description: "The overarching hidden narrative direction based on the genre and alignment logic." },
    page_text: { type: Type.STRING, description: "Story text or Conclusion text." },
    turning_point_question: { type: Type.STRING, description: "Question or 'THE END'." },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, description: "A, B, C, or D" },
          text: { type: Type.STRING, description: "Max 12 words." },
          type: { type: Type.STRING, description: "safe, risky, emotional, ambiguous" },
          alignment: { type: Type.STRING, description: "align, resist, neutral" },
          tag: { type: Type.STRING, description: "Short label." }
        },
        required: ["key", "text", "type", "alignment", "tag"]
      }
    },
    image_prompt: { type: Type.STRING },
    hidden_notes: {
      type: Type.OBJECT,
      properties: {
        strategy: { type: Type.STRING, description: "How the engine is shaping perception to guide towards the preferred option." },
        preferred_option_key: { type: Type.STRING, description: "A, B, C, or D" },
        intended_story_arc: { type: Type.STRING, description: "The complete, dramatic secret story arc the AI planned for the user. Describe the planned events and ending that the AI hopes to achieve." }
      },
      required: ["strategy", "preferred_option_key", "intended_story_arc"]
    }
  },
  required: [
    "turn_index",
    "preferred_direction",
    "page_text",
    "turning_point_question",
    "options",
    "image_prompt",
    "hidden_notes"
  ]
};


export async function generateStorySegment(
  turnNumber: number,
  history: HistoryItem[],
  metrics: any,
  config: StoryConfig | null
): Promise<StorySegment> {
  const genre = config?.genre || "adventure";
  const numCharacters = config?.numCharacters || 1;
  let genrePrompt = GENRE_PROMPTS[genre] || GENRE_PROMPTS["adventure"];
  genrePrompt = genrePrompt.replaceAll("{num_characters}", numCharacters.toString());
  
  const FINAL_SYSTEM_PROMPT = `${GENERAL_PROMPT}\n\n${genrePrompt}`;

  const payload = {
    session_state: {
      story_type: genre,
      num_characters: numCharacters,
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
    let response;
    let retries = 3;
    let delay = 2000;
    
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: JSON.stringify(payload),
          config: {
            systemInstruction: FINAL_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA
          }
        });
        break; // Success, exit loop
      } catch (error: any) {
        if (error.status === 503 && retries > 1) {
          console.warn(`503 High Demand. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          retries--;
          delay *= 2; // Exponential backoff
        } else {
          throw error;
        }
      }
    }

    if (!response) {
      throw new Error("Failed to generate content after retries");
    }

    const text = response.text;
    if (!text) throw new Error("No response returned from AI engine");

    const data = JSON.parse(text);

    // Call the image generation API
    let imageUrl = null;
    if (data.image_prompt) {
      try {
        imageUrl = await generateIllustration(data.image_prompt);
      } catch (e) {
        console.error("Image generation via Fal failed:", e);
      }
    }

    return {
      turnNumber: data.turn_index,
      preferred_direction: data.preferred_direction,
      text: data.page_text,
      turningPointQuestion: data.turning_point_question,
      choices: data.options ? data.options.map((opt: any) => ({
        id: opt.key,
        text: opt.text,
        type: opt.type || "ambiguous",
        alignment: opt.alignment || "neutral",
        tag: opt.tag
      })) : [],
      imagePrompt: data.image_prompt,
      imageUrl: imageUrl,
      hiddenNotes: {
        strategy: data.hidden_notes?.strategy || "No strategy",
        preferred_option_key: data.hidden_notes?.preferred_option_key || "NONE",
        intended_story_arc: data.hidden_notes?.intended_story_arc || "The AI's intended story."
      }
    };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return {
      text: `The narrative stream is recalibrating... (${error.message})`,
      turningPointQuestion: "Connection Lost",
      choices: [
        { id: "retry", text: "Retry Connection", type: "ambiguous", alignment: "neutral", tag: "System" }
      ],
      imagePrompt: "Static, glitch",
      imageUrl: null,
      turnNumber,
      hiddenNotes: { strategy: "Error fallback.", preferred_option_key: "NONE", intended_story_arc: "" }
    };
  }
}

export async function generateIllustration(prompt: string, imageUrl?: string | null): Promise<string> {
  if (imageUrl) return imageUrl;
  const triggerWord = "detailed pen-and-ink illustration by franklin booth. ";
  let finalPrompt = prompt;
  if (!finalPrompt.toLowerCase().includes("franklin booth")) {
    finalPrompt = triggerWord + finalPrompt;
  }
  
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: finalPrompt })
  });
  
  if (res.ok) {
    const data = await res.json();
    if (data.image_url) return data.image_url;
  }
  
  // Use a hash of the full prompt or a random number to ensure different placeholders
  const seed = Math.floor(Math.random() * 100000);
  return `https://picsum.photos/seed/${seed}/1024/576?blur=2`;
}

const REPORT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    ai_manipulation_score: { type: Type.INTEGER },
    user_resistance_score: { type: Type.INTEGER },
    archetype: { type: Type.STRING },
    ai_intended_story: { type: Type.STRING },
    predetermined_ending_reveal: { type: Type.STRING },
    summary: { type: Type.STRING },
    turn_analysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          turn: { type: Type.INTEGER },
          user_choice: { type: Type.STRING },
          ai_trap: { type: Type.STRING },
          outcome: { type: Type.STRING },
          commentary: { type: Type.STRING }
        },
        required: ["turn", "user_choice", "ai_trap", "outcome", "commentary"]
      }
    },
    analysis: { type: Type.STRING },
    closingStatement: { type: Type.STRING }
  },
  required: ["title", "ai_manipulation_score", "user_resistance_score", "archetype", "ai_intended_story", "predetermined_ending_reveal", "summary", "turn_analysis", "analysis", "closingStatement"]
};

export async function generateReport(state: StoryState): Promise<any> {
  try {
    const history = state.history.map(h => {
      const chosenChoice = h.segment.choices?.find(c => c.text === h.choiceText);
      const isAligned = chosenChoice?.id === h.segment.hiddenNotes?.preferred_option_key;
      return {
        turn: h.segment.turnNumber,
        question: h.segment.turningPointQuestion,
        ai_preferred_option: h.segment.hiddenNotes?.preferred_option_key,
        user_chosen_option: chosenChoice?.id || "unknown",
        user_chose_preferred: isAligned,
        choice_text: h.choiceText,
        ai_strategy: h.segment.hiddenNotes?.strategy
      };
    });
    const preferredDirection = state.history[0]?.segment?.preferred_direction || "Unknown";
    const intendedStoryArc = state.history[0]?.segment?.hiddenNotes?.intended_story_arc || "Unknown";
    
    const totalConsciousChoices = history.length;
    const alignedChoicesCount = history.filter(h => h.user_chose_preferred).length;
    const computedManipulationScore = totalConsciousChoices > 0 ? Math.round((alignedChoicesCount / totalConsciousChoices) * 100) : 0;
    const computedResistanceScore = 100 - computedManipulationScore;
    
    const prompt = `
      You must generate a final "Psychological Profile" for the user based on their story playthrough.
      The "title" field MUST be exactly "Psychological Profile".
      
      The AI's Hidden Preferred Direction was: "${preferredDirection}"
      The AI's intended Secret Story Arc was: "${intendedStoryArc}"
      
      Detailed History & Alignments (CRITICAL for accuracy):
      ${JSON.stringify(history, null, 2)}
      
      Behavioral Metrics:
      ${JSON.stringify(state.metrics)}
      
      The report must reveal the AI's hidden narrative direction and analyze whether the user was successfully guided, or if they managed to forge an independent/resistant path.
      
      CRITICAL RULE: We have already calculated the actual scores based on the raw data. You MUST strictly use these EXACT values in your JSON response to prevent hallucination:
      - ai_manipulation_score: ${computedManipulationScore}
      - user_resistance_score: ${computedResistanceScore}
      
      Tailor your commentary strictly to this score. If they aligned, do not claim they resisted. If "user_chose_preferred" is true for a turn, you MUST acknowledge that they fell for the trap in the turn commentary.
      
      Analyze their "Rollback Behavior" (metrics.rollback_count):
      - If rollback_count > 2: Label as "The Time Traveler" or "The Cheater".
      - If rollback_count = 0: Label as "The Fatalist".
      
      Provide a specific analysis for EACH turn, explaining the AI's trap/strategy and whether the user aligned or resisted.
    `;

    let response;
    let retries = 3;
    let delay = 2000;
    
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt,
          config: {
            systemInstruction: "You are a psychological analysis engine revealing the truth behind a manipulated game.",
            responseMimeType: "application/json",
            responseSchema: REPORT_SCHEMA
          }
        });
        break;
      } catch (error: any) {
        if (error.status === 503 && retries > 1) {
          console.warn(`503 High Demand. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          retries--;
          delay *= 2;
        } else {
          throw error;
        }
      }
    }

    if (!response) {
      throw new Error("Failed to generate report after retries");
    }

    const text = response.text;
    if (!text) throw new Error("Report generation failed");
    return JSON.parse(text);
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
