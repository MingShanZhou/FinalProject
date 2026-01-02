import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Primary and Fallback Models
const MODEL_PRIMARY = 'gemini-3-flash-preview';
const MODEL_FALLBACK = 'gemini-2.0-flash-exp';

/**
 * Helper to clean JSON string if Markdown code blocks are present
 */
const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Robust content generation with fallback
 */
const generateContentSafe = async (params: any): Promise<GenerateContentResponse> => {
    try {
        return await ai.models.generateContent({
            ...params,
            model: MODEL_PRIMARY
        });
    } catch (error: any) {
        // If 404 (Model Not Found) or 403 (Permission/Billing), try fallback
        if (error.status === 404 || error.code === 404 || error.status === 403 || error.code === 403) {
            console.warn(`Primary model ${MODEL_PRIMARY} failed, falling back to ${MODEL_FALLBACK}`);
            return await ai.models.generateContent({
                ...params,
                model: MODEL_FALLBACK
            });
        }
        throw error;
    }
};

/**
 * 1. Text Translation
 */
export const translateText = async (text: string, targetLang: string) => {
  try {
    const response = await generateContentSafe({
      contents: `Translate the following text into ${targetLang}. Only return the translated text, no explanations. Text: "${text}"`,
    });
    return response.text || "Translation failed.";
  } catch (error) {
    console.error("Translation Error:", error);
    return "Error: Could not translate.";
  }
};

/**
 * 2. Image Translation (Menu/Signage)
 */
export const translateImage = async (base64Image: string, targetLang: string) => {
  try {
    // Remove header if present (data:image/png;base64,)
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await generateContentSafe({
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: `Identify the text in this image and translate it to ${targetLang}. 
                     Format the output as a clear list of items found. 
                     If it looks like a menu, list the dish name and a brief description.` }
        ]
      }
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Image Translation Error:", error);
    return "Error: Could not process image.";
  }
};

/**
 * 3. Location Details (Structured JSON)
 */
export const getLocationDetails = async (locationName: string, city: string) => {
    try {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                address: { type: Type.STRING },
                description: { type: Type.STRING },
            },
            required: ["lat", "lng", "description"]
        };

        const response = await generateContentSafe({
            contents: `Give me the latitude, longitude, and a short description (in Traditional Chinese) for "${locationName}" in "${city}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");
        return JSON.parse(cleanJson(text));

    } catch (error) {
        console.error("Location Error:", error);
        // Fallback
        return { 
            lat: 0, 
            lng: 0, 
            address: "", 
            description: "無法取得詳細資訊，請稍後再試。" 
        };
    }
}

/**
 * 4. Currency Detection
 */
export const getDestinationCurrency = async (destination: string) => {
    try {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                currencyCode: { type: Type.STRING, description: "ISO 4217 Currency Code e.g. JPY" },
                rateToTWD: { type: Type.NUMBER, description: "Approximate exchange rate to TWD" }
            },
            required: ["currencyCode", "rateToTWD"]
        };

        const response = await generateContentSafe({
            contents: `What is the currency used in ${destination}? And what is the approximate exchange rate to New Taiwan Dollar (TWD)?`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const text = response.text;
        if (!text) return { currencyCode: 'USD', rateToTWD: 30 };
        return JSON.parse(cleanJson(text));

    } catch (error) {
        console.error("Currency Error:", error);
        return { currencyCode: 'USD', rateToTWD: 30 };
    }
}

/**
 * 5. Weather Forecast
 */
export const getWeatherForecast = async (location: string, date: string) => {
    try {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                condition: { type: Type.STRING },
                minTemp: { type: Type.NUMBER },
                maxTemp: { type: Type.NUMBER },
                icon: { type: Type.STRING, description: "One of: sun, cloud, rain, snow, storm" }
            },
            required: ["condition", "minTemp", "maxTemp", "icon"]
        };

        const response = await generateContentSafe({
            contents: `Predict the typical weather for ${location} on ${date}. Return average min/max temperature in Celsius.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");
        return JSON.parse(cleanJson(text));

    } catch (error) {
        // Fallback
        return { condition: 'Unknown', minTemp: 20, maxTemp: 25, icon: 'sun' };
    }
}