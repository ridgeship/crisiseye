import { mutation } from "./_generated/server";

export const clearOldIncidents = mutation({
  args: {},
  handler: async (ctx) => {
    const allIncidents = await ctx.db.query("incidents").collect();
    for (const incident of allIncidents) {
      await ctx.db.delete(incident._id);
    }
    return `Deleted ${allIncidents.length} old incidents.`;
  },
});
