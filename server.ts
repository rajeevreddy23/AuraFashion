import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK on the server safely
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// 1. Proxy Image Endpoint to bypass CORS
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
      return;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (error: any) {
    console.error("Error proxying image:", error);
    res.status(500).json({ error: `Internal proxy error: ${error.message}` });
  }
});

// 2. Try-On API route (Server-side Gemini call)
app.post("/api/tryon", async (req, res) => {
  const { userImageBase64, dressImageBase64 } = req.body;
  if (!userImageBase64 || !dressImageBase64) {
    res.status(400).json({ error: "Missing required images" });
    return;
  }

  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Generate a realistic image of the person in the first image wearing the exact dress shown in the second image. The fit should be natural, and the person's pose should remain similar. Output only the resulting image." },
            { inlineData: { mimeType: "image/jpeg", data: userImageBase64.split(",")[1] || userImageBase64 } },
            { inlineData: { mimeType: "image/jpeg", data: dressImageBase64.split(",")[1] || dressImageBase64 } }
          ]
        }
      ]
    });

    let resultBase64 = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultBase64) {
      // Fallback
      resultBase64 = dressImageBase64;
    }

    res.json({ result: resultBase64 });
  } catch (error: any) {
    console.error("Error in tryon api:", error);
    res.status(500).json({ error: error.message || "Failed to process virtual try-on" });
  }
});

// 3. Sketch Processing API route (Server-side Gemini call)
app.post("/api/process-sketch", async (req, res) => {
  const { sketchBase64, dressType, userImageBase64, instructions } = req.body;
  if (!sketchBase64 || !dressType) {
    res.status(400).json({ error: "Missing required sketch or dressType" });
    return;
  }

  try {
    const aiInstance = getAI();
    const parts: any[] = [];
    
    let prompt = `I am providing a sketch of a ${dressType}. The sketch image contains a background grid and a light gray template outline. Please ignore the grid and the template outline, and focus only on the hand-drawn lines. Convert this sketch into a realistic, high-quality fashion design image.`;
    
    if (instructions) {
      prompt += ` Follow these additional design instructions: ${instructions}.`;
    }

    if (userImageBase64) {
      prompt += ` Generate the resulting design and show it being worn by the person in the provided photo. The fit should be natural and realistic.`;
    }

    prompt += ` Output only the resulting image.`;

    parts.push({ text: prompt });
    parts.push({ inlineData: { mimeType: "image/png", data: sketchBase64.split(",")[1] || sketchBase64 } });
    
    if (userImageBase64) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: userImageBase64.split(",")[1] || userImageBase64 } });
    }

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: [{ role: "user", parts }]
    });

    let resultBase64 = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!resultBase64) {
      resultBase64 = sketchBase64;
    }

    res.json({ result: resultBase64 });
  } catch (error: any) {
    console.error("Error in process-sketch api:", error);
    res.status(500).json({ error: error.message || "Failed to process sketch" });
  }
});

// Vite middleware for development, static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
