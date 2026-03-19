import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CountryData {
  name: string;
  isoCode: string;
  currentScore: number;
  status: 'Stable' | 'Elevated' | 'Critical';
  indicators: {
    mediaFreedom: number;
    judicialIndependence: number;
    civilSociety: number;
    electionQuality: number;
    executiveConstraints: number;
    rhetoricRadar: number;
    civicProtests: number;
  };
  history: { year: number; score: number }[];
  events: { date: string; title: string; description: string; type: 'legal' | 'political' | 'protest' }[];
}

export async function generateNarrativeSummary(country: CountryData): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the following democratic stress data for ${country.name} and provide a concise, authoritative narrative summary (max 3 sentences). 
      Current Score: ${country.currentScore}/100. Status: ${country.status}.
      Indicators: ${JSON.stringify(country.indicators)}.
      Recent History: ${JSON.stringify(country.history.slice(-3))}.
      Key Events: ${JSON.stringify(country.events.slice(0, 2))}.
      
      Start with a headline-style sentence like "Democratic stress: [status] and [trend] due to...". 
      Mention specific indicator drops if significant.`,
    });

    return response.text || "Summary unavailable at this time.";
  } catch (error) {
    console.error("Error generating narrative:", error);
    return "Democratic stress levels are being monitored. Recent trends suggest a shift in institutional stability across key indicators.";
  }
}
