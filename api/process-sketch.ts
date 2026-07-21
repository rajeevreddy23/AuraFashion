import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

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

    res.status(200).json({ result: resultBase64 });
  } catch (error: any) {
    console.error("Error in process-sketch api:", error);
    res.status(500).json({ error: error.message || "Failed to process sketch" });
  }
}
