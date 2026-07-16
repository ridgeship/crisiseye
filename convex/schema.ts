import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()), // Temporary for mock auth
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.string()), // 'citizen', 'police', 'fire', 'ambulance', 'nadmo', 'ecg', 'admin'
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("email", ["email"]),

  incidents: defineTable({
    type: v.string(), // Fire, Flood, etc.
    description: v.optional(v.string()),
    severity: v.string(), // low, moderate, high, critical
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
      isApproximate: v.optional(v.boolean()),
    }),
    mediaUrls: v.optional(v.array(v.string())), // Images or Video URLs (or storage IDs)
    voiceReportUrl: v.optional(v.string()), // Voice note URL
    status: v.string(), // Active, Responding, Resolved, etc.
    timestamp: v.number(),
    userId: v.optional(v.id("users")),

    // RESPONDER DASHBOARD FIELDS
    assignedAgency: v.optional(v.string()), // 'police', 'fire', 'ambulance', 'nadmo', 'ecg'
    assignedUnit: v.optional(v.string()),
    verificationStatus: v.optional(v.string()), // 'pending', 'verified', 'needs-verification', 'dispatcher-review'
    confidenceScore: v.optional(v.number()), // 0 - 100
    evidenceSummary: v.optional(v.string()),
    escalationLevel: v.optional(v.number()), // 0, 1, 2, 3
    acknowledgementStatus: v.optional(v.string()), // 'pending', 'acknowledged', 'escalated'
    
    // AI Vision fields
    mediaStatus: v.optional(v.string()), // 'Relevant', 'Needs Manual Review', 'Rejected'
    aiSummary: v.optional(v.string()),
    evidenceConfidence: v.optional(v.string()), // 'High', 'Medium', 'Low'
    
    // Emergency Timeline (Array of events)
    timeline: v.optional(
      v.array(
        v.object({
          time: v.number(),
          status: v.string(),
          note: v.string(),
        })
      )
    ),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_agency", ["assignedAgency"]),
});
