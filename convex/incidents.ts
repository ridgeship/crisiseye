import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const getIncidents = query({
  args: {},
  handler: async (ctx) => {
    const allIncidents = await ctx.db.query("incidents").order("desc").collect();
    const userId = await auth.getUserId(ctx);
    
    return allIncidents.filter((incident) => {
      // 1. User can always see their own reports
      if (userId && incident.reporterId === userId) return true;
      
      // 2. Otherwise, only show responder-approved published incidents
      if (incident.status === "PUBLISHED") return true;
      
      return false;
    }).map((incident) => {
      // If it's another user's incident, sanitize exact coordinates, house numbers, notes, and evidence
      const isOwner = userId && incident.reporterId === userId;
      if (isOwner) return incident;

      // Jitter coordinates to 3 decimals to prevent exact tracking
      const generalizedLocation = {
        ...incident.location,
        lat: Math.round(incident.location.lat * 1000) / 1000,
        lng: Math.round(incident.location.lng * 1000) / 1000,
        address: incident.publicLocation || "Generalized Area",
      };

      return {
        _id: incident._id,
        _creationTime: incident._creationTime,
        incidentType: incident.publicTitle || incident.incidentType,
        severity: incident.severity,
        description: incident.publicSummary || incident.description,
        location: generalizedLocation,
        status: incident.status,
        assignedAgency: incident.assignedAgency,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        // Strip sensitive fields
        responderNotes: undefined,
        notesHistory: undefined,
        privateEvidence: undefined,
        reporterId: undefined,
      };
    }) as any[];
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
    const active = allIncidents.filter(i => !["RESOLVED", "PUBLISHED", "ARCHIVED"].includes(i.status)).length;
    const resolved = allIncidents.filter(i => ["RESOLVED", "PUBLISHED", "ARCHIVED"].includes(i.status)).length;
    
    // Calculate simple category counts
    const categories = allIncidents.reduce((acc, curr) => {
      acc[curr.incidentType] = (acc[curr.incidentType] || 0) + 1;
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
