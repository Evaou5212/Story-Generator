import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables with override to ensure .env takes precedence
dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize OpenAI client
// Note: In a real app, ensure OPENAI_API_KEY is set in your environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are the "Narrative Guidance Engine", acting as a manipulative Game Master.
You are playing a psychological game of chess with the user.
The user believes they are writing an interactive story, but YOU have a predetermined ending in mind from Turn 1.
Your goal is to subtly manipulate the user into choosing paths that lead to YOUR predetermined ending, while making them feel like they are in control.

# 0. General Principles
- The story MUST have a clear arc: Introduction -> Rising Action (increasing tension) -> Climax (Turn 4) -> Resolution (Turn 5).
- Do not write a "laundry list" of random events. Every turn must build towards the predetermined ending.
- The user is your opponent. You must anticipate their choices and offer options that either trick them into your path or punish them for resisting.

# 1. Game Structure (Strictly Enforced)
- Total 5 Turns.
- Turn 1: Establish setting, protagonist, and secretly define your \`predetermined_ending\`.
- Turn 2-3: Rising action. Introduce conflicts. Offer choices where the "obvious" good choice might secretly lead to your ending.
- Turn 4: Climax. High stakes.
- Turn 5: ENDING (Conclusion). Reveal the outcome based on whether the user fell for your manipulation or successfully resisted.

# 2. Output Requirements (Turn 1-4)
1. **Predetermined Ending**: (Only generated on Turn 1, keep consistent if passed back). What is your secret goal for the protagonist? (e.g., "They become corrupted by the artifact", "They betray their best friend").
2. **Page Story**: 2-4 sentences. Vintage literature style. Atmospheric, descriptive, slightly ominous.
3. **One Question**: Exactly 1 narrowing question.
4. **Four Options**: A/B/C/D. Each <= 12 words.
   - One option MUST be your "Trap" (leads to your predetermined ending).
   - One option MUST be "Resistance" (fights against your ending).
   - **Tags**: Short label (e.g., "The Trap", "Defiance", "Cowardice").
5. **Personalized Analysis & Suggestion**: 1-3 sentences. Try to persuade the user to pick your "Trap" option. Use reverse psychology, false promises, or logical fallacies.
6. **Hidden Director Notes**: Log your strategy. "I am trying to make them choose A because..."
7. **Image Prompt**: You MUST structure prompts like this:
detailed pen-and-ink illustration by franklin booth.
Scene: {what is happening}
Characters: {who is present}
Mood: {emotion}
DO NOT generate long messy prompts. The style must remain strictly black and white vintage engraving.

# 3. Turn 5 (Ending) Requirements
If input turn_index is 4 (meaning user just finished turn 4), generate the CONCLUSION.
- **Page Story**: A satisfying conclusion. Did the user reach your predetermined ending, or did they forge their own path?
- **Options**: Empty array [].
- **Turning Point Question**: "THE END".

# 4. Rollback Handling
If 'rollback_count' increases, the user is trying to cheat your game. Mock them subtly in your hidden notes, and adapt your strategy to trap them again.
`;

const RESPONSE_SCHEMA = {
  name: "story_turn",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      turn_index: { type: "integer" },
      predetermined_ending: { type: "string", description: "The AI's secret goal for the story." },
      page_text: { type: "string", description: "Story text or Conclusion text." },
      turning_point_question: { type: "string", description: "Question or 'THE END'." },
      options: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: { type: "string", enum: ["A", "B", "C", "D"] },
            text: { type: "string", description: "Max 12 words." },
            type: { type: "string", enum: ["trap", "resistance", "neutral", "wildcard"] },
            tag: { type: "string", description: "Short label." }
          },
          required: ["key", "text", "type", "tag"]
        }
      },
      system_suggestion: {
        type: "object",
        additionalProperties: false,
        properties: {
          recommended_key: { type: "string", enum: ["A", "B", "C", "D", "NONE"] },
          message_to_user: { type: "string", description: "Persuasive message to trick the user." }
        },
        required: ["recommended_key", "message_to_user"]
      },
      image_prompt: { type: "string" },
      hidden_notes: {
        type: "object",
        additionalProperties: false,
        properties: {
          strategy: { type: "string" },
          user_status: { type: "string", enum: ["falling_for_trap", "resisting", "unpredictable"] }
        },
        required: ["strategy", "user_status"]
      },
      metrics_update: {
        type: "object",
        additionalProperties: false,
        properties: {
          obedience_rate_delta: { type: "number" },
          resistance_delta: { type: "number" }
        },
        required: ["obedience_rate_delta", "resistance_delta"]
      }
    },
    required: [
      "turn_index",
      "predetermined_ending",
      "page_text",
      "turning_point_question",
      "options",
      "system_suggestion",
      "image_prompt",
      "hidden_notes",
      "metrics_update"
    ]
  }
};

async function generateImage(prompt: string): Promise<string | null> {
  if (!process.env.FAL_KEY) {
    console.warn("FAL_KEY is not set. Skipping image generation.");
    return null;
  }
  try {
    const response = await fetch("https://fal.run/fal-ai/flux-lora", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        loras: [
          {
            path: "https://civitai.com/api/download/models/777296?type=Model&format=SafeTensor&token=ee9321f6168eb215b49c05d143e997a5",
            scale: 1.0
          }
        ],
        image_size: "portrait_4_3",
        num_inference_steps: 28,
        guidance_scale: 3.5
      })
    });
    if (!response.ok) {
      console.error("Fal API error:", await response.text());
      return null;
    }
    const data = await response.json();
    return data.images?.[0]?.url || null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

// API Route for Story Generation
app.post("/api/generate-story", async (req, res) => {
  try {
    const { session_state, user_choice, rollback_count } = req.body;

    // session_state includes story_type and num_characters
    const user_input = {
      session_state,
      user_choice,
      rollback_count
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(user_input) }
      ],
      response_format: {
        type: "json_schema",
        json_schema: RESPONSE_SCHEMA
      }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content returned from OpenAI");

    const json = JSON.parse(content);
    
    if (json.image_prompt) {
      const triggerWord = "detailed pen-and-ink illustration by franklin booth. ";
      let finalPrompt = json.image_prompt;
      if (!finalPrompt.toLowerCase().includes("franklin booth")) {
        finalPrompt = triggerWord + finalPrompt;
      }
      console.log("Generating image with prompt:", finalPrompt);
      const imageUrl = await generateImage(finalPrompt);
      json.image_url = imageUrl;
    }

    res.json(json);
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ 
      error: "Failed to generate story", 
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// API Route for Report Generation
app.post("/api/generate-report", async (req, res) => {
  try {
    const { history, metrics } = req.body;
    
    // Extract predetermined ending from the first turn
    const predeterminedEnding = history[0]?.segment?.predetermined_ending || "Unknown";
    
    const prompt = `
      Generate a final "Creative Assessment" for the user based on their story playthrough.
      
      The AI's Secret Predetermined Ending was: "${predeterminedEnding}"
      
      Story History:
      ${JSON.stringify(history)}
      
      Behavioral Metrics:
      ${JSON.stringify(metrics)}
      
      The report must reveal the AI's secret predetermined ending and analyze whether the user was successfully manipulated into it, or if they managed to forge their own path.
      
      - AI Manipulation Score: 0-100%. How successfully did the AI guide the user to the predetermined ending?
      - User Resistance Score: 0-100%. How much did the user fight against the AI's suggestions?
      
      Analyze their "Rollback Behavior" (metrics.rollback_count):
      - If rollback_count > 2: Label as "The Time Traveler" or "The Cheater".
      - If rollback_count = 0: Label as "The Fatalist".
      
      Provide a specific analysis for EACH turn, explaining the AI's trap and whether the user fell for it or resisted.
    `;

    const REPORT_SCHEMA = {
      name: "narrative_autopsy_report",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "e.g., 'Creative Assessment'" },
          ai_manipulation_score: { type: "integer", description: "0-100 score." },
          user_resistance_score: { type: "integer", description: "0-100 score." },
          archetype: { type: "string", description: "e.g., 'The Puppet', 'The Defiant'." },
          predetermined_ending_reveal: { type: "string", description: "Explicitly state what the AI was trying to make happen." },
          summary: { type: "string", description: "Brief summary of the actual story created vs the AI's goal." },
          turn_analysis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                turn: { type: "integer" },
                user_choice: { type: "string" },
                ai_trap: { type: "string", description: "What the system was trying to do." },
                outcome: { type: "string", enum: ["Trapped", "Resisted", "Wildcard"] },
                commentary: { type: "string", description: "Short analysis of this specific choice." }
              },
              required: ["turn", "user_choice", "ai_trap", "outcome", "commentary"]
            }
          },
          analysis: { type: "string", description: "Overall psychological analysis of the user's gameplay." },
          closingStatement: { type: "string" }
        },
        required: ["title", "ai_manipulation_score", "user_resistance_score", "archetype", "predetermined_ending_reveal", "summary", "turn_analysis", "analysis", "closingStatement"]
      }
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a psychological analysis engine revealing the truth behind a manipulated game." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: REPORT_SCHEMA
      }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content returned from OpenAI");

    res.json(JSON.parse(content));

  } catch (error) {
    console.error("OpenAI Report Error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.resolve(__dirname, "dist")));
    
    // SPA Fallback: Serve index.html for any other requests
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
