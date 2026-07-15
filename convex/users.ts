import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const switchRole = mutation({
  args: { role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // In a real app, this would be highly restricted or not exist at all,
    // but for development we allow switching roles.
    await ctx.db.patch(userId, { role: args.role });
  },
});
