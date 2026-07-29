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
    reporterId: v.optional(v.id("users")),
    incidentType: v.string(), // Fire, Flood, etc.
    severity: v.string(), // low, moderate, high, critical
    description: v.optional(v.string()),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
      isApproximate: v.optional(v.boolean()),
    }),
    media: v.optional(v.array(v.string())), // renamed from mediaUrls
    voiceNote: v.optional(v.string()), // renamed from voiceReportUrl
    
    visibility: v.union(v.literal("PRIVATE"), v.literal("PUBLIC"), v.literal("RESTRICTED")),
    privacyPreference: v.union(v.literal("private"), v.literal("allow_publication")),
    
    status: v.union(
      v.literal("RECEIVED"), 
      v.literal("AI_REVIEW"), 
      v.literal("PENDING_REVIEW"), 
      v.literal("ACCEPTED"), 
      v.literal("ASSIGNED"), 
      v.literal("EN_ROUTE"), 
      v.literal("ON_SCENE"), 
      v.literal("RESOLVED"), 
      v.literal("PUBLISHED"), 
      v.literal("ARCHIVED")
    ),
    
    statusHistory: v.array(v.object({
      status: v.string(),
      timestamp: v.number(),
      note: v.optional(v.string()),
      userId: v.optional(v.id("users")),
    })),
    
    assignedAgency: v.optional(v.string()),
    assignedResponder: v.optional(v.id("users")),
    
    aiConfidence: v.optional(v.number()),
    verificationResult: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiLabels: v.optional(v.array(v.string())),
    aiSuggestedPriority: v.optional(v.string()),
    aiSuggestedAgency: v.optional(v.array(v.string())),
    aiRiskAssessment: v.optional(v.string()),
    aiManualReview: v.optional(v.boolean()),
    aiManualReviewReason: v.optional(v.string()),
    aiSpamOrMeme: v.optional(v.boolean()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    
    published: v.optional(v.boolean()),
    publishable: v.optional(v.boolean()),
    
    publicTitle: v.optional(v.string()),
    publicLocation: v.optional(v.string()),
    publicMedia: v.optional(v.array(v.string())),
    publicSummary: v.optional(v.string()),
    responderNotes: v.optional(v.string()),
    privateEvidence: v.optional(v.string()),
    notesHistory: v.optional(v.array(v.object({
      note: v.string(),
      timestamp: v.number(),
      author: v.string(),
    }))),
  })
    .index("by_status", ["status"])
    .index("by_type", ["incidentType"])
    .index("by_agency", ["assignedAgency"])
    .index("by_visibility", ["visibility"]),
    
  bookmarks: defineTable({
    userId: v.id("users"),
    incidentId: v.id("incidents"),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  discoveryPosts: defineTable({
    type: v.string(), // "news" | "advisory" | "road_closure" | "weather" | "awareness"
    title: v.string(),
    content: v.string(),
    category: v.string(), // Emergency News, Weather, Community Safety, Utilities, etc.
    severity: v.optional(v.string()), // low, moderate, high, critical
    expiryDate: v.optional(v.number()),
    agency: v.optional(v.string()),
    actionRequired: v.optional(v.string()),
    media: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),
    
  notifications: defineTable({
    userId: v.id("users"),
    incidentId: v.optional(v.id("incidents")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
