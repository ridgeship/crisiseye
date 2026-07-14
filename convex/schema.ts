import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // Add other fields as needed for @convex-dev/auth if customized,
    // though auth typically manages its own tables if using the standard convex auth.
  }).index("by_email", ["email"]),
  
  incidents: defineTable({
    type: v.string(), // Fire, Flood, etc.
    description: v.optional(v.string()),
    severity: v.string(), // Low, Moderate, High, Critical
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    }),
    mediaUrls: v.optional(v.array(v.string())), // Images or Video URLs (or storage IDs)
    voiceReportUrl: v.optional(v.string()), // Voice note URL
    status: v.string(), // Active, Resolved, etc.
    timestamp: v.number(),
    userId: v.optional(v.id("users")),
  }).index("by_status", ["status"]).index("by_type", ["type"]),
});
