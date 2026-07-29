export const INCIDENT_STATUSES = [
  "RECEIVED", 
  "AI_REVIEW", 
  "PENDING_REVIEW", 
  "ACCEPTED", 
  "ASSIGNED", 
  "EN_ROUTE", 
  "ON_SCENE", 
  "RESOLVED", 
  "PUBLISHED", 
  "ARCHIVED"
] as const;

export type IncidentStatus = typeof INCIDENT_STATUSES[number];

export const VISIBILITY_LEVELS = [
  "PRIVATE",
  "PUBLIC",
  "RESTRICTED"
] as const;

export type VisibilityLevel = typeof VISIBILITY_LEVELS[number];

export const PRIVACY_PREFERENCES = [
  "private",
  "allow_publication"
] as const;

export type PrivacyPreference = typeof PRIVACY_PREFERENCES[number];
