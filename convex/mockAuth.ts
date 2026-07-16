import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists.");
    }
    const isResponder = args.email.toLowerCase().includes("responder") || args.email.toLowerCase().includes("police");
    const role = isResponder ? "police" : "citizen";

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      role: role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    if (user.password !== args.password) {
      throw new Error("Invalid email or password.");
    }

    return user._id;
  },
});

export const logout = mutation({
  args: {},
  handler: async (ctx) => {
    // In a stateless mock auth, logout is handled client-side (localStorage).
    // This mutation exists to satisfy interface requirements.
    return true;
  },
});
