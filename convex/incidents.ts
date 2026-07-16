import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidents").order("desc").collect();
  },
});

export const reportIncident = mutation({
  args: {
    type: v.string(),
    description: v.optional(v.string()),
    severity: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
      isApproximate: v.optional(v.boolean()),
    }),
    mediaUrls: v.optional(v.array(v.string())),
    voiceReportUrl: v.optional(v.string()),
    mediaStatus: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    evidenceConfidence: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // We could add user auth check here later
    const now = Date.now();
    const newIncidentId = await ctx.db.insert("incidents", {
      ...args,
      status: "Active",
      timestamp: now,
      verificationStatus: "pending",
      escalationLevel: 1,
      acknowledgementStatus: "pending",
      timeline: [{
        time: now,
        status: "Citizen Report Received",
        note: "Initial report received from citizen"
      }]
    });
    return newIncidentId;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allIncidents = await ctx.db.query("incidents").collect();
    const active = allIncidents.filter(i => i.status === "Active").length;
    const resolved = allIncidents.filter(i => i.status === "Resolved").length;
    
    // Calculate simple category counts
    const categories = allIncidents.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      active,
      resolved,
      total: allIncidents.length,
      categories,
    };
  }
});
