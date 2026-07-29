import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const MOCK_INCIDENTS: any[] = [
  {
    incidentType: "Fire",
    description: "Large structural fire at the main market. Sending multiple units.",
    severity: "critical",
    location: { lat: 5.5717, lng: -0.2408, address: "Kaneshie Market, Accra" },
    status: "EN_ROUTE",
    visibility: "PRIVATE",
    privacyPreference: "allow_publication",
    assignedAgency: "fire",
    aiConfidence: 95,
    verificationResult: "Verified by multiple sources",
    statusHistory: [
      { timestamp: Date.now() - 1000 * 60 * 15, status: "RECEIVED", note: "Reported by anonymous citizen" },
      { timestamp: Date.now() - 1000 * 60 * 10, status: "ACCEPTED", note: "Unit F-12 accepted dispatch" },
      { timestamp: Date.now() - 1000 * 60 * 5, status: "EN_ROUTE", note: "Unit en route" },
    ]
  },
  {
    incidentType: "Power Outage",
    description: "Transformer exploded near the roundabout.",
    severity: "high",
    location: { lat: 6.6885, lng: -1.6244, address: "Adum, Kumasi" },
    status: "RECEIVED",
    visibility: "PRIVATE",
    privacyPreference: "allow_publication",
    assignedAgency: "ecg",
    aiConfidence: 78,
    verificationResult: "pending",
    statusHistory: [
      { timestamp: Date.now() - 1000 * 60 * 5, status: "RECEIVED", note: "Citizen Report Submitted" }
    ]
  },
  {
    incidentType: "Road Accident",
    description: "Multi-vehicle collision on highway.",
    severity: "high",
    location: { lat: 5.5333, lng: -0.4167, address: "Kasoa Highway" },
    status: "ASSIGNED",
    visibility: "PRIVATE",
    privacyPreference: "private",
    assignedAgency: "ambulance",
    aiConfidence: 50,
    verificationResult: "dispatcher-review",
    statusHistory: [
      { timestamp: Date.now() - 1000 * 60 * 20, status: "RECEIVED", note: "Citizen Report Submitted" },
      { timestamp: Date.now() - 1000 * 60 * 15, status: "ASSIGNED", note: "Local Unit Notified" }
    ]
  },
  {
    incidentType: "Crime / Security",
    description: "Suspicious activity near bank.",
    severity: "moderate",
    location: { lat: 9.4008, lng: -0.8393, address: "Tamale Central" },
    status: "RECEIVED",
    visibility: "PRIVATE",
    privacyPreference: "allow_publication",
    assignedAgency: "police",
    aiConfidence: 30,
    verificationResult: "needs-verification",
    statusHistory: [
      { timestamp: Date.now() - 1000 * 60 * 2, status: "RECEIVED", note: "Citizen Report Submitted" }
    ]
  }
];

export const seedDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing mock incidents created by seed to avoid duplicates
    const existing = await ctx.db.query("incidents").collect();
    for (const incident of existing) {
      if (incident.description?.includes("mock") || incident.assignedAgency) {
         await ctx.db.delete(incident._id);
      }
    }

    // Insert new ones
    for (const data of MOCK_INCIDENTS) {
      await ctx.db.insert("incidents", {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Clear old discovery posts
    const oldPosts = await ctx.db.query("discoveryPosts").collect();
    for (const post of oldPosts) {
      await ctx.db.delete(post._id);
    }

    // Seed Discovery Posts / Safety advisories
    const mockPosts = [
      {
        type: "advisory",
        title: "Kaneshie Flood Risk Warning",
        content: "Heavy seasonal rains are expected to cause flooding around the Circle Interchange and Kaneshie Market area. Residents are advised to avoid low-lying roads and move valuables to higher ground.",
        category: "Flood",
        severity: "high",
        expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 3, // 3 days expiry
        agency: "nadmo",
        actionRequired: "Evacuate low-lying areas if waters begin rising. Avoid driving through flooded sections.",
      },
      {
        type: "road_closure",
        title: "Independence Avenue Closed for Maintenance",
        content: "Independence Avenue from the Liberation Roundabout to Ako Adjei Interchange will be closed for emergency road works starting tonight at 10 PM. Diversions are in place.",
        category: "Road Accident",
        severity: "moderate",
        expiryDate: Date.now() + 1000 * 60 * 60 * 12, // 12 hours expiry
        agency: "police",
        actionRequired: "Follow posted signs. Use bypass roads via Ring Road East.",
      },
      {
        type: "news",
        title: "New Fire Hydrant Stations Installed in Kumasi Central",
        content: "The Ghana National Fire Service has successfully commissioned 15 new high-pressure fire hydrants in the Kumasi central business district to accelerate emergency response times.",
        category: "Emergency News",
        severity: "low",
        agency: "fire",
      },
      {
        type: "weather",
        title: "Severe Storm Warning: Southern Ghana",
        content: "A major storm system with high winds and severe lightning is moving westward across the Volta and Greater Accra regions. Roof damage and localized power outages are possible.",
        category: "Weather",
        severity: "critical",
        expiryDate: Date.now() + 1000 * 60 * 60 * 6, // 6 hours
        agency: "nadmo",
        actionRequired: "Remain indoors. Unplug sensitive electrical devices. Secure loose outdoor items.",
      }
    ];

    for (const post of mockPosts) {
      await ctx.db.insert("discoveryPosts", {
        ...post,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
