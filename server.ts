import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables with override to ensure .env takes precedence
dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Diagnostic logging for Render
console.log("Starting server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", PORT);
console.log("FAL_KEY set:", !!process.env.FAL_KEY);

// Middleware to parse JSON bodies
app.use(express.json());

// Health check for Render
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Root path check for diagnostics
app.get("/api/check", (req, res) => {
  res.json({
    status: "online",
    env: process.env.NODE_ENV,
    keys: {
      fal: !!process.env.FAL_KEY
    }
  });
});

async function generateImage(prompt: string, retries = 2): Promise<string | null> {
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
      if (retries > 0) {
        console.warn(`Fal API error. Retrying... (${retries} left)`);
        await new Promise(res => setTimeout(res, 2000));
        return generateImage(prompt, retries - 1);
      }
      console.error("Fal API error:", await response.text());
      return null;
    }
    const data = await response.json();
    return data.images?.[0]?.url || null;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Image generation failed. Retrying... (${retries} left)`, error);
      await new Promise(res => setTimeout(res, 2000));
      return generateImage(prompt, retries - 1);
    }
    console.error("Image generation failed:", error);
    return null;
  }
}

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }
    const imageUrl = await generateImage(prompt);
    res.json({ image_url: imageUrl });
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    res.status(500).json({ error: "Failed to generate image" });
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
