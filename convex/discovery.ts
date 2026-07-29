import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Get discovery feed containing both published incidents and custom discovery posts
export const getDiscoveryFeed = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);

    // 1. Fetch published incidents
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    // 2. Fetch custom safety alerts & advisories
    const discoveryPosts = await ctx.db
      .query("discoveryPosts")
      .order("desc")
      .collect();

    // 3. Fetch user bookmarks to mark bookmarked items
    let bookmarkedIds = new Set<string>();
    if (userId) {
      const bookmarks = await ctx.db
        .query("bookmarks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      bookmarkedIds = new Set(bookmarks.map((b) => b.incidentId));
    }

    // Map incidents to a unified discovery feed item structure
    const incidentFeedItems = incidents.map((inc) => {
      // Generalise coordinates to 3 decimals to hide exact addresses
      const jitteredLat = Math.round(inc.location.lat * 1000) / 1000;
      const jitteredLng = Math.round(inc.location.lng * 1000) / 1000;

      // Estimate reading time: 200 words per minute
      const wordCount = (inc.publicSummary || inc.description || "").split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      return {
        id: inc._id,
        type: "incident",
        title: inc.publicTitle || `Emergency: ${inc.incidentType}`,
        summary: inc.publicSummary || inc.description || "No public summary provided.",
        category: inc.incidentType, // Fire, Flood, etc.
        severity: inc.severity,
        location: inc.publicLocation || "Reported Area",
        coordinates: { lat: jitteredLat, lng: jitteredLng },
        media: inc.publicMedia || [],
        agency: inc.assignedAgency || "EOC Coordination",
        publishedAt: inc.publishedAt || inc.createdAt,
        readingTime: `${readingTime} min read`,
        tags: [inc.incidentType, inc.severity, inc.assignedAgency || "General"].filter(Boolean),
        isBookmarked: bookmarkedIds.has(inc._id),
      };
    });

    // Map custom posts
    const postFeedItems = discoveryPosts.map((post) => {
      const wordCount = post.content.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      return {
        id: post._id,
        type: post.type, // "news", "advisory", "road_closure", etc.
        title: post.title,
        summary: post.content,
        category: post.category, // Emergency News, Community Safety, etc.
        severity: post.severity || "moderate",
        location: "Regional Alert",
        media: post.media || [],
        agency: post.agency || "National Disaster Command",
        publishedAt: post.createdAt,
        readingTime: `${readingTime} min read`,
        tags: [post.category, post.type].filter(Boolean),
        isBookmarked: bookmarkedIds.has(post._id),
        expiryDate: post.expiryDate,
        actionRequired: post.actionRequired,
      };
    });

    // Return unified array sorted by published date desc
    return [...incidentFeedItems, ...postFeedItems].sort(
      (a, b) => b.publishedAt - a.publishedAt
    );
  },
});

// Citizen Public Map endpoint - only public information, general coordinates
export const getPublicMapIncidents = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    const discoveryPosts = await ctx.db
      .query("discoveryPosts")
      .filter((q) => q.eq(q.field("type"), "road_closure"))
      .collect();

    // Map public safety alert markers
    const incidentMarkers = incidents.map((inc) => {
      // Generalise coordinates to hide exact coordinates
      const lat = Math.round(inc.location.lat * 1000) / 1000;
      const lng = Math.round(inc.location.lng * 1000) / 1000;

      return {
        id: inc._id,
        type: "incident",
        category: inc.incidentType,
        title: inc.publicTitle || inc.incidentType,
        summary: inc.publicSummary || inc.description || "",
        locationName: inc.publicLocation || "Ghana Central",
        severity: inc.severity,
        agency: inc.assignedAgency || "NEOC",
        lat,
        lng,
        publishedAt: inc.publishedAt || inc.createdAt,
      };
    });

    const closureMarkers = discoveryPosts.map((post) => ({
      id: post._id,
      type: "road_closure",
      category: "Road Closure",
      title: post.title,
      summary: post.content,
      locationName: "Closure Point",
      severity: post.severity || "high",
      agency: post.agency || "Police",
      lat: 5.56, // general mock lat/lng for Ghana capitals if closures don't specify
      lng: -0.20,
      publishedAt: post.createdAt,
    }));

    return [...incidentMarkers, ...closureMarkers];
  },
});

// Toggle Bookmark Mutation
export const toggleBookmark = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("incidentId"), args.incidentId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    } else {
      await ctx.db.insert("bookmarks", {
        userId,
        incidentId: args.incidentId,
        createdAt: Date.now(),
      });
      return { bookmarked: true };
    }
  },
});

// Get Bookmarked Articles
export const getBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (bookmarks.length === 0) return [];

    const incidentIds = bookmarks.map((b) => b.incidentId);
    
    // Fetch bookmarked incidents
    const results = [];
    for (const id of incidentIds) {
      const inc = await ctx.db.get(id);
      if (inc && inc.status === "PUBLISHED") {
        results.push({
          id: inc._id,
          type: "incident",
          title: inc.publicTitle || inc.incidentType,
          summary: inc.publicSummary || inc.description || "",
          category: inc.incidentType,
          location: inc.publicLocation || "Ghana",
          media: inc.publicMedia || [],
          publishedAt: inc.publishedAt || inc.createdAt,
        });
      }
    }
    return results.sort((a, b) => b.publishedAt - a.publishedAt);
  },
});

// Citizen Notification Queries
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Mark Notification as Read
export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    await ctx.db.patch(args.id, { read: true });
  },
});

// Create discovery bulletin mutation (used for seeding and emergency alerts)
export const createDiscoveryPost = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    severity: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    agency: v.optional(v.string()),
    actionRequired: v.optional(v.string()),
    media: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("discoveryPosts", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});
