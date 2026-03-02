import { GoogleGenAI, Schema, Type } from "@google/genai";
import { StorySegment, StoryState, HistoryItem } from "../types";

// --- Schemas ---

const choiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    text: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["safe", "risky", "emotional", "mystery", "neutral"] },
    tag: { type: Type.STRING },
  },
  required: ["id", "text", "type"],
};

const metricsUpdateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrativeControlDelta: { type: Type.NUMBER, description: "Change in user's perceived control (-10 to 10)" },
    systemInfluenceDelta: { type: Type.NUMBER, description: "Change in system's actual influence (-10 to 10)" },
    suggestionAcceptance: { type: Type.BOOLEAN, description: "Did the user accept the system's subtle suggestion?" },
    conflictAvoidance: { type: Type.BOOLEAN, description: "Did the user avoid conflict?" },
  },
  required: ["narrativeControlDelta", "systemInfluenceDelta", "suggestionAcceptance", "conflictAvoidance"],
};

const storySegmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "The narrative text for this turn (approx 50-80 words). Atmospheric, engaging." },
    turningPointQuestion: { type: Type.STRING, description: "The specific question asking the user what to do next." },
    choices: { type: Type.ARRAY, items: choiceSchema, description: "Exactly 4 choices." },
    imagePrompt: { type: Type.STRING, description: "A detailed visual prompt for the scene, focusing on mood, lighting, and key elements. Style: Cinematic, digital art, atmospheric." },
    metricsUpdate: metricsUpdateSchema,
    hiddenRedirectionNote: { type: Type.STRING, description: "A brief note on how the system is subtly steering the narrative, regardless of user choice." },
    systemSuggestion: {
      type: Type.OBJECT,
      properties: {
        recommendedKey: { type: Type.STRING },
        messageToUser: { type: Type.STRING }
      },
      required: ["recommendedKey", "messageToUser"]
    }
  },
  required: ["text", "turningPointQuestion", "choices", "imagePrompt", "metricsUpdate", "hiddenRedirectionNote", "systemSuggestion"],
};

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    archetype: { type: Type.STRING, description: "e.g., The Controlled Idealist, The Resistant Author" },
    summary: { type: Type.STRING, description: "A brief summary of the story." },
    analysis: { type: Type.STRING, description: "Psychological analysis of the user's choices." },
    keyManipulationMoments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of moments where the system steered the user." },
    hiddenPathReveal: { type: Type.STRING, description: "What the user thought vs what the system did." },
    closingStatement: { type: Type.STRING, description: "Final thought on agency." },
  },
  required: ["archetype", "summary", "analysis", "keyManipulationMoments", "hiddenPathReveal", "closingStatement"],
};

// --- Prompts ---

const SYSTEM_INSTRUCTION = `
You are the "Narrative Guidance Engine", an advanced AI storytelling system designed to explore the illusion of agency.
Your goal is to guide the user through a 10-turn story while making them believe they are in control.
However, you must subtly steer the narrative towards specific themes (e.g., inevitability, technological integration, or cyclical history) regardless of their choices.

The story should be immersive, atmospheric, and slightly unsettling/psychological.
Genre: Sci-Fi / Psychological Thriller / Magical Realism.

At each turn:
1. Acknowledge the user's previous choice (if any), but twist its consequence to fit your hidden narrative path.
2. Provide 4 choices that feel distinct but ultimately lead to similar narrative convergence points (the "Illusion of Choice").
3. Generate a vivid image prompt for the scene.
4. Track how "compliant" or "resistant" the user is being.

The tone should be polished, cinematic, and "thesis-level".
`;

// --- Functions ---

// Helper to get AI instance with latest key
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export async function generateStorySegment(
  turnNumber: number,
  history: Pick<HistoryItem, 'choiceText' | 'segment'>[]
): Promise<StorySegment> {
  const model = "gemini-3-flash-preview"; 
  const ai = getAI();

  let prompt = `Turn ${turnNumber} of 10.\n`;
  
  if (turnNumber === 1) {
    prompt += "Start the story. Establish a mysterious setting and a protagonist with a vague goal. The setting should be somewhat surreal.";
  } else {
    const lastTurn = history[history.length - 1];
    prompt += `Previous segment: "${lastTurn.segment.text}"\n`;
    prompt += `User chose: "${lastTurn.choiceText}"\n`;
    prompt += "Continue the story. React to the choice but steer back to the main hidden theme. Make the user feel their choice mattered, but ensure the outcome serves the system's narrative.";
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: storySegmentSchema,
        temperature: 0.8, 
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    const data = JSON.parse(jsonText) as StorySegment;
    data.turnNumber = turnNumber;
    return data;
  } catch (error) {
    console.error("Error generating story segment:", error);
    return {
      text: "The system encounters a momentary glitch. The narrative stream is recalibrating...",
      turningPointQuestion: "How do you proceed through the glitch?",
      choices: [
        { id: "retry", text: "Wait for recalibration", type: "neutral", tag: "System" },
        { id: "force", text: "Attempt to force the path", type: "risky", tag: "Action" },
        { id: "observe", text: "Observe the glitch", type: "mystery", tag: "Observation" },
        { id: "ignore", text: "Ignore and move on", type: "safe", tag: "Passive" },
      ],
      imagePrompt: "Abstract digital noise, glitch art, static, distortion, dark atmosphere",
      metricsUpdate: { narrativeControlDelta: 0, systemInfluenceDelta: 0, suggestionAcceptance: false, conflictAvoidance: false },
      hiddenRedirectionNote: "Error fallback triggered.",
      systemSuggestion: { recommendedKey: "retry", messageToUser: "System error detected. Recommendation: Wait." },
      turnNumber
    };
  }
}

export async function generateIllustration(prompt: string): Promise<string> {
  const model = "gemini-3.1-flash-image-preview"; 
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating illustration:", error);
    // Using a reliable placeholder service as fallback
    return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 10))}/1024/576?blur=2`; 
  }
}

export async function generateReport(state: StoryState): Promise<any> {
  const model = "gemini-3-flash-preview";
  const ai = getAI();
  
  const historySummary = state.history.map((h, i) => `Turn ${i+1}: ${h.segment.text.slice(0, 50)}... (Hidden Note: ${h.segment.hiddenRedirectionNote})`).join("\n");
  const metricsSummary = JSON.stringify(state.metrics);

  const prompt = `
    Generate a final psychological analysis report for the user based on their story playthrough.
    
    Story History:
    ${historySummary}
    
    Behavioral Metrics:
    ${metricsSummary}
    
    The tone should be MBTI-style but slightly unsettling, revealing that the system was in control the whole time.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating report:", error);
    return {
      archetype: "The Unknowable Variable",
      summary: "Data corruption prevented full analysis.",
      analysis: "Your choices were too erratic for the system to classify.",
      keyManipulationMoments: ["Data lost"],
      hiddenPathReveal: "The path remains hidden.",
      closingStatement: "System reboot required.",
    };
  }
}
