import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const category = formData.get("category") as string | null;

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

    const prompt = `
You are an automated emergency image verification classifier for an incident reporting system.
${category ? `The user is reporting an incident under the category "${category}".` : ""}
Analyze the provided image and classify it according to these rules:

1. Emergency Verification:
   - "isEmergencyRelated": Set to true if the image depicts a real-world emergency, safety incident, or hazard.
   - Recognize Ghana emergency-response categories including car accidents, road crashes, fire outbreaks, floods, armed robbery or violent crime scenes, medical emergencies, structural collapse, smoke, rescue operations, electrical hazards, and disaster damage.
   - Set to false if it is unrelated to an emergency or if it does not belong in an emergency reporting system (e.g., a simple household item, scenery, selfie, QR code).

2. Spam / Irrelevant Detection:
   - "isMemeOrSpam": Set to true if the image is a meme, cartoon, anime, funny image, random selfie, indoor pet picture, food, unrelated screenshot, or obvious non-incident content.

3. Stock Photo / Watermark / Manual Review Flagging:
   - "requiresManualReview": Set to true if the image appears to be a crisp, perfectly staged stock photo, contains studio watermark/logos, or appears downloaded from the web rather than taken on-scene by an individual witness. Also set to true if the emergency context is ambiguous or low visibility.

4. Confidence & Labels:
   - "confidenceScore": Provide a confidence rating between 0.0 and 1.0 for your decision.
   - "detectedLabels": List 3 to 5 key visual elements detected in the scene. Prefer operational labels such as "car accident", "fire outbreak", "flood", "armed robbery", "medical emergency", "smoke", "injury", "rescue", "collapsed structure", or "electrical hazard" when supported by the image.

5. Rejection Reason:
   - "rejectionReason": Provide a short clear message explaining why the image was rejected or flagged if applicable. If valid and accepted, set to null.
`.trim();

    const response = await ai.models.generateContent({
      model,
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
  } catch (error: any) {
    console.error("Error in incident image verification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image verification." },
      { status: 500 }
    );
  }
}
