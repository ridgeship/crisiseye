import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const MOCK_INCIDENTS = [
  {
    type: "Fire",
    description: "Large structural fire at the main market. Sending multiple units.",
    severity: "critical",
    location: { lat: 5.5717, lng: -0.2408, address: "Kaneshie Market, Accra" },
    status: "Active",
    assignedAgency: "fire",
    verificationStatus: "verified",
    confidenceScore: 95,
    escalationLevel: 2,
    acknowledgementStatus: "acknowledged",
    timeline: [
      { time: Date.now() - 1000 * 60 * 15, status: "Citizen Report Submitted", note: "Reported by anonymous citizen" },
      { time: Date.now() - 1000 * 60 * 14, status: "GPS Captured", note: "Verified within 5m accuracy" },
      { time: Date.now() - 1000 * 60 * 13, status: "Verification Complete", note: "Multiple reports detected" },
      { time: Date.now() - 1000 * 60 * 12, status: "Local Unit Notified", note: "Fire Service Station 3 alerted" },
      { time: Date.now() - 1000 * 60 * 10, status: "Unit Accepted", note: "Unit F-12 accepted dispatch" },
    ]
  },
  {
    type: "Power Outage",
    description: "Transformer exploded near the roundabout.",
    severity: "high",
    location: { lat: 6.6885, lng: -1.6244, address: "Adum, Kumasi" },
    status: "Active",
    assignedAgency: "ecg",
    verificationStatus: "pending",
    confidenceScore: 78,
    escalationLevel: 0,
    acknowledgementStatus: "pending",
    timeline: [
      { time: Date.now() - 1000 * 60 * 5, status: "Citizen Report Submitted", note: "Images attached" }
    ]
  },
  {
    type: "Road Accident",
    description: "Multi-vehicle collision on highway.",
    severity: "high",
    location: { lat: 5.5333, lng: -0.4167, address: "Kasoa Highway" },
    status: "Active",
    assignedAgency: "ambulance",
    verificationStatus: "dispatcher-review",
    confidenceScore: 50,
    escalationLevel: 1,
    acknowledgementStatus: "pending",
    timeline: [
      { time: Date.now() - 1000 * 60 * 20, status: "Citizen Report Submitted", note: "" },
      { time: Date.now() - 1000 * 60 * 15, status: "Local Unit Notified", note: "Ambulance pending" }
    ]
  },
  {
    type: "Crime / Security",
    description: "Suspicious activity near bank.",
    severity: "moderate",
    location: { lat: 9.4008, lng: -0.8393, address: "Tamale Central" },
    status: "Active",
    assignedAgency: "police",
    verificationStatus: "needs-verification",
    confidenceScore: 30,
    escalationLevel: 0,
    acknowledgementStatus: "pending",
    timeline: [
      { time: Date.now() - 1000 * 60 * 2, status: "Citizen Report Submitted", note: "" }
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
         // for safety, only deleting ones with assignedAgency since that's our new field
         await ctx.db.delete(incident._id);
      }
    }

    // Insert new ones
    for (const data of MOCK_INCIDENTS) {
      await ctx.db.insert("incidents", {
        ...data,
        timestamp: Date.now(),
      });
    }
  },
});
