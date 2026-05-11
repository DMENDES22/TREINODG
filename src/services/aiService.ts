import { GoogleGenAI, Type } from "@google/genai";
import { SetLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getProgressionSuggestion(exerciseName: string, recentSets: SetLog[]) {
  const model = "gemini-3-flash-preview";
  
  const historyString = recentSets
    .map(s => `${s.reps} reps with ${s.weight}kg`)
    .join(", ");

  const prompt = `
    Based on the following workout history for the exercise "${exerciseName}":
    History: ${historyString}
    
    The user is looking to progress (progressive overload). 
    Suggest if they should increase weight, increase reps, or stay the same.
    Provide a short explanation in Portuguese.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestionType: { 
              type: Type.STRING, 
              enum: ["INCREASE_WEIGHT", "INCREASE_REPS", "DELOAD", "STAY_SAME"] 
            },
            amount: { type: Type.NUMBER, description: "Amount to increase if applicable" },
            explanation: { type: Type.STRING }
          },
          required: ["suggestionType", "explanation"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Progression Error:", error);
    return {
      suggestionType: "STAY_SAME",
      explanation: "Não foi possível carregar a sugestão da IA no momento."
    };
  }
}
