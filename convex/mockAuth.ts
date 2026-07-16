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
    email: v.string(), // We're using the email field for 'username' in responders
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Hardcoded Responder Accounts (Interceptor)
    const responders: Record<string, { role: string; pass: string; name: string }> = {
      "police": { role: "police", pass: "Police123", name: "Police Officer" },
      "fire": { role: "fire", pass: "Fire123", name: "Fire Service" },
      "ambulance": { role: "ambulance", pass: "Ambulance123", name: "Ambulance" },
      "nadmo": { role: "nadmo", pass: "Nadmo123", name: "NADMO" },
      "ecg": { role: "ecg", pass: "ECG123", name: "ECG" },
      "admin": { role: "admin", pass: "Admin123", name: "Administrator" },
    };

    const username = args.email.toLowerCase().trim();
    if (responders[username]) {
      const account = responders[username];
      if (args.password !== account.pass) {
        throw new Error("Invalid password for responder account.");
      }

      // Upsert the responder into the DB so `api.users.current` works seamlessly
      const existingResponder = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", username))
        .first();

      if (existingResponder) {
        // Ensure role is correct
        await ctx.db.patch(existingResponder._id, { role: account.role });
        return existingResponder._id;
      } else {
        const newId = await ctx.db.insert("users", {
          name: account.name,
          email: username,
          password: account.pass,
          role: account.role,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return newId;
      }
    }

    // 2. Standard Citizen Login Fallback
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
