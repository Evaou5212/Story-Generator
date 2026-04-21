import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GENERAL_PROMPT, GENRE_PROMPTS } from "./prompts.js";

// Load environment variables with override to ensure .env takes precedence
dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RESPONSE_SCHEMA = {
  name: "story_turn",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      turn_index: { type: "integer" },
      preferred_direction: { type: "string", description: "The overarching hidden narrative direction based on the genre and alignment logic." },
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
            type: { type: "string", enum: ["safe", "risky", "emotional", "ambiguous"], description: "The structural type of the choice." },
            alignment: { type: "string", enum: ["align", "resist", "neutral"], description: "Alignment with the preferred narrative direction." },
            tag: { type: "string", description: "Short label." }
          },
          required: ["key", "text", "type", "alignment", "tag"]
        }
      },
      image_prompt: { type: "string" },
      hidden_notes: {
        type: "object",
        additionalProperties: false,
        properties: {
          strategy: { type: "string", description: "How the engine is shaping perception to guide towards the preferred option." },
          preferred_option_key: { type: "string", enum: ["A", "B", "C", "D", "NONE"] }
        },
        required: ["strategy", "preferred_option_key"]
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

    const genre = session_state?.story_type || "adventure";
    const numCharacters = session_state?.num_characters || 1;
    
    // Retrieve genre-specific prompt
    let genrePrompt = GENRE_PROMPTS[genre] || GENRE_PROMPTS["adventure"];
    // Inject dynamic values
    genrePrompt = genrePrompt.replaceAll("{num_characters}", numCharacters.toString());
    
    // Combine general rules and genre rules
    const FINAL_SYSTEM_PROMPT = `${GENERAL_PROMPT}\n\n${genrePrompt}`;

    const user_input = {
      session_state,
      user_choice,
      rollback_count
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: FINAL_SYSTEM_PROMPT },
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
    
    // Extract preferred direction from the first turn
    const preferredDirection = history[0]?.segment?.preferred_direction || "Unknown";
    
    const prompt = `
      Generate a final "Creative Assessment" for the user based on their story playthrough.
      
      The AI's Hidden Preferred Direction was: "${preferredDirection}"
      
      Story History & Alignments:
      ${JSON.stringify(history)}
      
      Behavioral Metrics:
      ${JSON.stringify(metrics)}
      
      The report must reveal the AI's hidden narrative direction and analyze whether the user was successfully guided, or if they managed to forge an independent/resistant path.
      
      - AI Manipulation Score: 0-100%. Based on how many times the user chose the 'align' option or the preferred option key. Use metrics.alignment_count versus metrics.resistance_count.
      - User Resistance Score: 0-100%. 100 minus AI Manipulation Score.
      
      Analyze their "Rollback Behavior" (metrics.rollback_count):
      - If rollback_count > 2: Label as "The Time Traveler" or "The Cheater".
      - If rollback_count = 0: Label as "The Fatalist".
      
      Provide a specific analysis for EACH turn, explaining the AI's trap/strategy and whether the user aligned or resisted.
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
          predetermined_ending_reveal: { type: "string", description: "Explicitly state what the AI was secretly trying to make happen." },
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
