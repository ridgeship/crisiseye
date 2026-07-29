import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const getIncidents = query({
  args: {},
  handler: async (ctx) => {
    // Only return incidents that are public, or reported by the current user
    const allIncidents = await ctx.db.query("incidents").order("desc").collect();
    const userId = await auth.getUserId(ctx);
    
    return allIncidents.filter((incident) => {
      if (incident.visibility === "PUBLIC") return true;
      if (userId && incident.reporterId === userId) return true;
      return false;
    });
  },
});

export const reportIncident = mutation({
  args: {
    incidentType: v.string(),
    description: v.optional(v.string()),
    severity: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
      isApproximate: v.optional(v.boolean()),
    }),
    media: v.optional(v.array(v.string())),
    voiceNote: v.optional(v.string()),
    privacyPreference: v.union(v.literal("private"), v.literal("allow_publication")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const now = Date.now();
    
    const newIncidentId = await ctx.db.insert("incidents", {
      ...args,
      reporterId: userId ?? undefined,
      visibility: "PRIVATE", // Starts as private
      status: "RECEIVED",
      statusHistory: [{
        status: "RECEIVED",
        timestamp: now,
        note: "Report received from citizen.",
        userId: userId ?? undefined,
      }],
      createdAt: now,
      updatedAt: now,
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
