import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google Gen AI client.
// It automatically reads the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  // Graceful fallback if API key is not configured
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        isEmergencyRelated: true,
        isMemeOrSpam: false,
        requiresManualReview: true,
        confidenceScore: 0,
        detectedLabels: [],
        rejectionReason: null,
        aiSkipped: true,
      },
      { status: 200 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided in request." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Convert uploaded image file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Prompt instructing Gemini 2.5 Flash on verification guidelines
    const prompt = `
You are an automated emergency image verification classifier for an incident reporting system.
Analyze the provided image and classify it according to these rules:

1. Emergency Verification:
   - "isEmergencyRelated": Set to true if the image depicts a real-world emergency, safety incident, or hazard (e.g., fires, smoke, floods, road accidents, vehicle crashes, structural collapse, hospital emergencies, bodily injury, medical distress, rescue operations).
   - Set to false if it is unrelated to an emergency.

2. Spam / Irrelevant Detection:
   - "isMemeOrSpam": Set to true if the image is a meme, cartoon, anime, funny image, random selfie, indoor pet picture, food, unrelated screenshot, or obvious non-incident content.

3. Stock Photo / Watermark / Manual Review Flagging:
   - "requiresManualReview": Set to true if the image appears to be a crisp, perfectly staged stock photo, contains studio watermark/logos, or appears downloaded from the web rather than taken on-scene by an individual witness. Also set to true if the emergency context is ambiguous or low visibility.

4. Confidence & Labels:
   - "confidenceScore": Provide a confidence rating between 0.0 and 1.0 for your decision.
   - "detectedLabels": List 3 to 5 key visual elements detected in the scene (e.g., ["fire", "smoke", "fire truck", "building"]).

5. Rejection Reason:
   - "rejectionReason": Provide a short clear message explaining why the image was rejected or flagged if applicable. If valid and accepted, set to null.
`.trim();

    // Request structured JSON output from gemini-2.5-flash using responseSchema
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isEmergencyRelated: { type: Type.BOOLEAN },
            isMemeOrSpam: { type: Type.BOOLEAN },
            requiresManualReview: { type: Type.BOOLEAN },
            confidenceScore: { type: Type.NUMBER },
            detectedLabels: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            rejectionReason: { type: Type.STRING, nullable: true },
          },
          required: [
            "isEmergencyRelated",
            "isMemeOrSpam",
            "requiresManualReview",
            "confidenceScore",
            "detectedLabels",
            "rejectionReason",
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No text returned from Gemini API");
    }

    const verificationResult = JSON.parse(responseText);

    return NextResponse.json(verificationResult, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in incident image verification:", error);
    // Graceful fallback - don't block citizen submission on AI errors
    return NextResponse.json(
      {
        isEmergencyRelated: true,
        isMemeOrSpam: false,
        requiresManualReview: true,
        confidenceScore: 0,
        detectedLabels: [],
        rejectionReason: null,
        aiSkipped: true,
      },
      { status: 200 }
    );
  }
}
