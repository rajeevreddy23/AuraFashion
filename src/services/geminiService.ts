import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function tryOnDress(userImageBase64: string, dressImageBase64: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Generate a realistic image of the person in the first image wearing the exact dress shown in the second image. The fit should be natural, and the person's pose should remain similar. Output only the resulting image." },
            { inlineData: { mimeType: "image/jpeg", data: userImageBase64.split(',')[1] || userImageBase64 } },
            { inlineData: { mimeType: "image/jpeg", data: dressImageBase64.split(',')[1] || dressImageBase64 } }
          ]
        }
      ]
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    // Fallback if no image part is returned (though gemini-2.5-flash-image should return one)
    return dressImageBase64;
  } catch (error) {
    console.error("Error in tryOnDress:", error);
    throw error;
  }
}

export async function processSketch(sketchBase64: string, dressType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: `I am providing a sketch of a ${dressType}. The image contains a background grid and a light gray template outline. Please ignore the grid and the template outline, and focus only on the hand-drawn lines. Convert this sketch into a realistic, high-quality fashion design image with professional textures, lighting, and fabric details. Output only the resulting image.` },
            { inlineData: { mimeType: "image/png", data: sketchBase64.split(',')[1] || sketchBase64 } }
          ]
        }
      ]
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return sketchBase64;
  } catch (error) {
    console.error("Error in processSketch:", error);
    throw error;
  }
}
