import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Media Validation Engine (Internal Service)
 * 
 * DEVELOPMENT PLACEHOLDER: 
 * This service is currently designed to receive uploaded media and flag the 
 * incident for manual verification. 
 * 
 * Architecture is ready for a real AI Vision API (e.g. OpenAI GPT-4 Vision).
 * When integrated, this function will:
 * 1. Fetch the media from the URL.
 * 2. Send it to the Vision API to classify relevance to the emergency category.
 * 3. Assign a `confidenceScore` (0-100) and update `verificationStatus` 
 *    to 'verified' or 'dispatcher-review'.
 */
export const validateMedia = internalMutation({
  args: {
    incidentId: v.id("incidents"),
    mediaUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // ---------------------------------------------------------
    // TODO: [AI Vision Integration]
    // const aiAnalysis = await analyzeWithVisionAPI(args.mediaUrls);
    // const score = aiAnalysis.confidenceScore;
    // ---------------------------------------------------------

    // Temporary placeholder logic: Since we don't have the AI API yet, 
    // any incident with media defaults to requiring human verification 
    // to ensure no fake/prank images slip through automatically.
    
    await ctx.db.patch(args.incidentId, {
      verificationStatus: "needs-verification",
      evidenceSummary: "Media uploaded. Pending AI/Dispatcher verification.",
      // confidenceScore: score // Will be populated by AI
    });

    // Add to timeline
    const incident = await ctx.db.get(args.incidentId);
    if (incident) {
      const timeline = incident.timeline || [];
      timeline.push({
        time: Date.now(),
        status: "Media Received",
        note: "Media queued for verification engine."
      });
      await ctx.db.patch(args.incidentId, { timeline });
    }
  },
});
