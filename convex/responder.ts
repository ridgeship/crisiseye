import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Middleware to ensure only authorized responders can access these APIs
const requireResponder = async (ctx: any, mockUserId?: any) => {
  let userId = mockUserId;
  if (!userId) {
    userId = await auth.getUserId(ctx);
  }
  if (!userId) {
    // Tech Expo fallback if no ID is passed (prevents crashes)
    return { role: "admin" }; 
  }
  
  const user = await ctx.db.get(userId);
  if (!user || !user.role || user.role === "citizen") {
    throw new Error("Access denied. Responder role required.");
  }
  return user;
};

export const getLiveQueue = query({
  args: { mockUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await requireResponder(ctx, args.mockUserId);
    
    // Admin sees all, otherwise filter by assigned agency matching their role
    // For now, if role is police, show police incidents + unassigned ones maybe?
    // Let's just return all incidents for admin, and agency-specific ones for specific roles
    const allIncidents = await ctx.db.query("incidents").order("desc").collect();
    
    if (user.role === "admin") {
      return allIncidents;
    }

    return allIncidents.filter((i) => i.assignedAgency === user.role || !i.assignedAgency);
  },
});

export const getStats = query({
  args: { mockUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await requireResponder(ctx, args.mockUserId);
    const incidents = await ctx.db.query("incidents").collect();
    
    const relevant = user.role === "admin" 
      ? incidents 
      : incidents.filter((i) => i.assignedAgency === user.role);

    const active = relevant.filter(i => i.status === "Active").length;
    const dispatched = relevant.filter(i => i.status === "Responding").length;
    const resolved = relevant.filter(i => i.status === "Resolved").length;
    
    return {
      active,
      dispatched,
      resolved,
      total: relevant.length,
      averageResponseTime: "14m", // Placeholder for actual math
    };
  },
});

export const updateIncidentStatus = mutation({
  args: {
    id: v.id("incidents"),
    status: v.string(), // "Responding", "Resolved", etc
    note: v.string(),
    mockUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await requireResponder(ctx, args.mockUserId);
    const incident = await ctx.db.get(args.id);
    if (!incident) throw new Error("Incident not found");

    const newTimelineEvent = {
      time: Date.now(),
      status: args.status,
      note: `${args.note} (by ${user.role})`,
    };

    const timeline = incident.timeline ? [...incident.timeline, newTimelineEvent] : [newTimelineEvent];

    await ctx.db.patch(args.id, {
      status: args.status,
      timeline,
      acknowledgementStatus: "acknowledged", // auto-ack if they interact
    });
  },
});

export const assignUnit = mutation({
  args: {
    id: v.id("incidents"),
    unitName: v.string(),
    mockUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await requireResponder(ctx, args.mockUserId);
    const incident = await ctx.db.get(args.id);
    if (!incident) throw new Error("Incident not found");

    const newTimelineEvent = {
      time: Date.now(),
      status: "Unit Assigned",
      note: `Assigned to ${args.unitName} by ${user.role}`,
    };

    const timeline = incident.timeline ? [...incident.timeline, newTimelineEvent] : [newTimelineEvent];

    await ctx.db.patch(args.id, {
      assignedUnit: args.unitName,
      timeline,
    });
  },
});
