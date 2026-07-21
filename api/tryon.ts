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
      resultBase64 = dressImageBase64;
    }

    res.status(200).json({ result: resultBase64 });
  } catch (error: any) {
    console.error("Error in tryon api:", error);
    res.status(500).json({ error: error.message || "Failed to process virtual try-on" });
  }
}
