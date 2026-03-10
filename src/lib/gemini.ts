import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SearchResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export async function searchDetailed(query: string): Promise<SearchResult> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Anda adalah 4Kaa AI, asisten pencarian cerdas. Berikan informasi yang sangat rinci, akurat, dan terstruktur dengan baik dalam Bahasa Indonesia. Gunakan Google Search untuk mendapatkan data terbaru. Berikan kutipan sumber jika memungkinkan.",
      },
    });

    const text = response.text || "Maaf, saya tidak dapat menemukan informasi tersebut.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = chunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Sumber",
        uri: chunk.web.uri,
      }));

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return {
      text,
      sources: uniqueSources,
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}
