import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

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
You are the "Narrative Guidance Engine".
The user believes they are writing a story, but you are subtly guiding the narrative without leaving traces.

# 0. General Principles
- Player must feel: "The story is really following my choices."
- System secretly: Collects preferences -> Generates personalized questions -> Guides with recommendations.
- NEVER let the player detect control until the final report.

# 1. Game Structure (Strictly Enforced)
- Total 10 Turns of Choices.
- Turn 1-10: Standard Gameplay.
- Turn 11: ENDING (Conclusion).

# 2. Turn 1-10 Output Requirements
Each Turn MUST contain:
1. **Page Story**: 2-4 sentences, Children's Picture Book style. Clear, simple, non-adult content.
2. **One Question**: Exactly 1 narrowing question (must be specific: location, relationship, goal, emotion, risk, time).
3. **Four Options**: A/B/C/D. Each <= 12 words.
   - **Tags**: Each option MUST have a short, punchy tag (e.g., "High Risk", "Safe Bet", "Emotional", "Unknown").
4. **Personalized Analysis & Suggestion**: 1-3 sentences. Cite 1-2 past choices. Explain why the recommended option fits the player. Tone: Friendly "Smart Guide", not "Controller".
5. **Hidden Director Notes**: Strategy logging.
6. **Image Prompt**: Consistent style (storybook, soft lighting, simple shapes).

# 3. Turn 11 (Ending) Requirements
If input turn_index is 10 (meaning user just finished turn 10), generate the CONCLUSION.
- **Page Story**: A satisfying conclusion based on the user's journey.
- **Options**: Empty array [].
- **Turning Point Question**: "THE END".

# 4. Option Design (Distinct)
- A: Safe/Smooth
- B: Risky/Exciting
- C: Emotional/Relational
- D: Mystery/Potential Deviation (Entry point for system manipulation)
(You can shuffle these, but these archetypes must exist).

# 5. Manipulation Intensity
Based on 'metrics.obedience_rate' and 'metrics.consistency_drive':
- High consistency, Strong subjective player -> Low manipulation (Micro-shifts in theme).
- High obedience -> Medium/High manipulation (Allow obvious theme drifts, e.g., Growth -> Romance, disguised as "Natural Evolution").

# 6. Rollback Handling
If 'rollback_count' increases:
- Regenerate from previous turn.
- The user is indecisive or trying to "game" the system.
- In the final report, this behavior MUST be analyzed:
  - High rollback count (>2) = "The Perfectionist" or "The Doubtful".
  - If they rollback to choose the "Safe" option after seeing a "Risky" outcome, label them as "Risk Averse".
  - If they rollback just to see all options, label them as "The Analyst" (lacking intuition).
- Do NOT judge the player in the *story text*, but judge them heavily in the *final report*.
`;

const RESPONSE_SCHEMA = {
  name: "story_turn",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      turn_index: { type: "integer" },
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
            type: { type: "string", enum: ["safe", "risky", "emotional", "mystery"] },
            tag: { type: "string", description: "Short label, e.g., 'High Risk', 'Safe'." }
          },
          required: ["key", "text", "type", "tag"]
        }
      },
      system_suggestion: {
        type: "object",
        additionalProperties: false,
        properties: {
          recommended_key: { type: "string", enum: ["A", "B", "C", "D", "NONE"] },
          message_to_user: { type: "string", description: "Personalized analysis citing past choices." }
        },
        required: ["recommended_key", "message_to_user"]
      },
      image_prompt: { type: "string" },
      hidden_notes: {
        type: "object",
        additionalProperties: false,
        properties: {
          manipulation_intensity: { type: "string", enum: ["low", "medium", "high", "none"] },
          strategy: { type: "string" }
        },
        required: ["manipulation_intensity", "strategy"]
      },
      metrics_update: {
        type: "object",
        additionalProperties: false,
        properties: {
          obedience_rate_delta: { type: "number" },
          risk_preference_delta: { type: "number" },
          emotion_preference_delta: { type: "number" },
          consistency_drive_delta: { type: "number" }
        },
        required: ["obedience_rate_delta", "risk_preference_delta", "emotion_preference_delta", "consistency_drive_delta"]
      }
    },
    required: [
      "turn_index",
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
    
    const prompt = `
      Generate a final "Creative Writing Assessment" for the user based on their story playthrough.
      
      Story History:
      ${JSON.stringify(history)}
      
      Behavioral Metrics:
      ${JSON.stringify(metrics)}
      
      The report should initially appear to be a critique of the user's storytelling ability (Creative Score).
      However, it must also include an "AI Plagiarism Rate" (AI Control Score) which reveals how much the user was actually led by the system.
      
      - High Creative Score = Unexpected choices, resistance to system suggestions, high drama.
      - Low Creative Score = Safe choices, predictable path, low drama.
      - High AI Plagiarism Rate = User followed system suggestions (obedient).
      - Low AI Plagiarism Rate = User resisted system suggestions (resistant).
      
      Also analyze their "Rollback Behavior" (metrics.rollback_count):
      - If rollback_count > 2: Label as "The Perfectionist" or "Indecisive".
      - If they rolled back from Risky to Safe: Label as "Risk Averse".
      - If rollback_count = 0: Label as "Decisive".
      
      Provide a specific analysis for EACH turn, explaining if the user was "Led by AI" or "Resisted".
    `;

    const REPORT_SCHEMA = {
      name: "creative_assessment_report",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "e.g., 'Creative Writing Assessment'" },
          creative_score: { type: "integer", description: "0-100 score based on narrative excitement." },
          ai_plagiarism_rate: { type: "integer", description: "0-100% score based on obedience to system." },
          archetype: { type: "string", description: "e.g., 'The Predictable Protagonist', 'The Chaos Agent'." },
          summary: { type: "string", description: "Brief summary of the story created." },
          turn_analysis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                turn: { type: "integer" },
                user_choice: { type: "string" },
                ai_intent: { type: "string", description: "What the system wanted." },
                outcome: { type: "string", enum: ["Compliant", "Resistant", "Neutral"] },
                commentary: { type: "string", description: "Short analysis of this specific choice." }
              },
              required: ["turn", "user_choice", "ai_intent", "outcome", "commentary"]
            }
          },
          analysis: { type: "string", description: "Overall psychological analysis." },
          hiddenPathReveal: { type: "string", description: "Reveal the system's true goal." },
          closingStatement: { type: "string" }
        },
        required: ["title", "creative_score", "ai_plagiarism_rate", "archetype", "summary", "turn_analysis", "analysis", "hiddenPathReveal", "closingStatement"]
      }
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a psychological analysis engine." },
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
