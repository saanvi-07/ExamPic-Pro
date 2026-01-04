
import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from "../utils/imageProcessor";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const verifyImageQuality = async (file: File, type: 'photo' | 'signature') => {
  const base64 = await fileToBase64(file);
  
  const systemInstruction = type === 'photo' 
    ? "You are an expert at verifying passport-sized photos for government job applications. Check if: 1. Face is clearly visible. 2. Background is light/white. 3. No sunglasses or hats. 4. Professional lighting. 5. Not blurry."
    : "You are an expert at verifying signatures for government applications. Check if: 1. It is clearly legible. 2. Signed in blue/black ink. 3. On a plain white background. 4. Not blurry. 5. Not in all capital letters.";

  const prompt = `Analyze this ${type} for a government exam application. Provide validation status and feedback.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType: file.type } }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN, description: "Whether the image is suitable for official forms" },
            feedback: { type: Type.STRING, description: "Advice for improvement or reason for failure" }
          },
          required: ["isValid", "feedback"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini verification failed:", error);
    return { isValid: true, feedback: "AI verification temporarily unavailable. Please verify manually." };
  }
};
