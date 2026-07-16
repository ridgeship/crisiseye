import { action } from "./_generated/server";
import { v } from "convex/values";

export const analyzeMedia = action({
  args: {
    categoryLabel: v.string(),
    base64DataUri: v.string(), // Full data URI, e.g., "data:image/jpeg;base64,..."
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set on the Convex backend.");
    }

    // Extract the mime type and the raw base64 string
    const match = args.base64DataUri.match(/^data:(.*?);base64,(.*)$/);
    if (!match || match.length !== 3) {
      throw new Error("Invalid base64 Data URI format");
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const prompt = `Analyze this image/video frame for a reported "${args.categoryLabel}" emergency. 
Does the media appear relevant to this type of emergency? 
Answer strictly in JSON format: 
{
  "status": "Relevant" | "Needs Manual Review" | "Irrelevant", 
  "explanation": "Brief explanation of what is detected."
}
If there is clear evidence related to the emergency (e.g. fire/smoke for a Fire Report), status should be Relevant.
If it's clearly unrelated (memes, QR codes, selfies, random scenery, logos, screenshots, product images), status should be Irrelevant.
If unsure, status should be Needs Manual Review.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API failed with status ${response.status}`);
    }

    const data = await response.json();
    try {
      const rawText = data.candidates[0].content.parts[0].text;
      // rawText is already expected to be JSON because of response_mime_type: "application/json"
      return JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse Gemini response", e, data);
      return { status: "Needs Manual Review", explanation: "Failed to parse AI response" };
    }
  },
});
