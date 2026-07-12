import type { LucideIcon } from 'lucide-react'
import {
  ShieldCheck,
  Flame,
  Ambulance,
  Waves,
  Car,
  CloudLightning,
  TriangleAlert,
  Users,
} from 'lucide-react'

export type IncidentCategory =
  | 'crime'
  | 'fire'
  | 'medical'
  | 'flood'
  | 'accident'
  | 'storm'
  | 'other'

export type Severity = 'low' | 'moderate' | 'high' | 'critical'

export type VerificationStatus =
  | 'verified'
  | 'pending'
  | 'needs-verification'
  | 'dispatcher-review'

export interface Incident {
  id: string
  title: string
  category: IncidentCategory
  severity: Severity
  region: string
  location: string
  lat: number
  lng: number
  reportedAt: string
  status: 'active' | 'responding' | 'resolved'
  confidence: number
  witnessReports: number
  gpsVerified: boolean
  hasEvidence: boolean
  verification: VerificationStatus
}

export const CATEGORY_META: Record<
  IncidentCategory,
  { label: string; icon: LucideIcon; color: string }
> = {
  crime: { label: 'Crime / Security', icon: ShieldCheck, color: '#4a83ff' },
  fire: { label: 'Fire', icon: Flame, color: '#ff5a4d' },
  medical: { label: 'Medical', icon: Ambulance, color: '#31c48d' },
  flood: { label: 'Flood', icon: Waves, color: '#3aa0ff' },
  accident: { label: 'Road Accident', icon: Car, color: '#f5b544' },
  storm: { label: 'Storm / Weather', icon: CloudLightning, color: '#9a7bff' },
  other: { label: 'Other', icon: TriangleAlert, color: '#94a3b8' },
}

export const SEVERITY_META: Record<Severity, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-muted-foreground border-border' },
  moderate: {
    label: 'Moderate',
    className: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
  },
  high: {
    label: 'High',
    className: 'text-orange-300 border-orange-400/40 bg-orange-400/10',
  },
  critical: {
    label: 'Critical',
    className: 'text-red-300 border-red-400/40 bg-red-400/10',
  },
}

export interface Agency {
  id: string
  name: string
  short: string
  phone: string
  logo: string
  icon: LucideIcon
  accent: string
}

export const AGENCIES: Agency[] = [
  {
    id: 'police',
    name: 'Ghana Police Service',
    short: 'Police',
    phone: '191',
    logo: '/agency-police.png',
    icon: ShieldCheck,
    accent: '#4a83ff',
  },
  {
    id: 'fire',
    name: 'Ghana National Fire Service',
    short: 'Fire Service',
    phone: '192',
    logo: '/agency-fire.png',
    icon: Flame,
    accent: '#ff5a4d',
  },
  {
    id: 'ambulance',
    name: 'National Ambulance Service',
    short: 'Ambulance',
    phone: '193',
    logo: '/agency-ambulance.png',
    icon: Ambulance,
    accent: '#31c48d',
  },
  {
    id: 'nadmo',
    name: 'NADMO',
    short: 'NADMO',
    phone: '0302 772 717',
    logo: '/agency-nadmo.png',
    icon: Users,
    accent: '#f5b544',
  },
]

// Sample active incidents across Ghana (used by map, dashboard, responder view).
export const INCIDENTS: Incident[] = [
  {
    id: 'INC-2041',
    title: 'Market fire outbreak',
    category: 'fire',
    severity: 'critical',
    region: 'Greater Accra',
    location: 'Kaneshie Market, Accra',
    lat: 5.5717,
    lng: -0.2408,
    reportedAt: '2026-07-12T09:12:00Z',
    status: 'responding',
    confidence: 92,
    witnessReports: 7,
    gpsVerified: true,
    hasEvidence: true,
    verification: 'verified',
  },
  {
    id: 'INC-2042',
    title: 'Flooding on major road',
    category: 'flood',
    severity: 'high',
    region: 'Greater Accra',
    location: 'Circle Interchange, Accra',
    lat: 5.5706,
    lng: -0.2072,
    reportedAt: '2026-07-12T08:40:00Z',
    status: 'active',
    confidence: 78,
    witnessReports: 4,
    gpsVerified: true,
    hasEvidence: false,
    verification: 'pending',
  },
  {
    id: 'INC-2043',
    title: 'Armed robbery reported',
    category: 'crime',
    severity: 'high',
    region: 'Ashanti',
    location: 'Adum, Kumasi',
    lat: 6.6885,
    lng: -1.6244,
    reportedAt: '2026-07-12T07:55:00Z',
    status: 'active',
    confidence: 54,
    witnessReports: 2,
    gpsVerified: true,
    hasEvidence: false,
    verification: 'dispatcher-review',
  },
  {
    id: 'INC-2044',
    title: 'Multi-vehicle collision',
    category: 'accident',
    severity: 'high',
    region: 'Central',
    location: 'Kasoa Highway',
    lat: 5.5333,
    lng: -0.4167,
    reportedAt: '2026-07-12T07:20:00Z',
    status: 'responding',
    confidence: 88,
    witnessReports: 6,
    gpsVerified: true,
    hasEvidence: true,
    verification: 'verified',
  },
  {
    id: 'INC-2045',
    title: 'Medical emergency — collapse',
    category: 'medical',
    severity: 'critical',
    region: 'Northern',
    location: 'Tamale Central',
    lat: 9.4008,
    lng: -0.8393,
    reportedAt: '2026-07-12T06:48:00Z',
    status: 'responding',
    confidence: 81,
    witnessReports: 3,
    gpsVerified: true,
    hasEvidence: false,
    verification: 'verified',
  },
  {
    id: 'INC-2046',
    title: 'Windstorm damage to roofs',
    category: 'storm',
    severity: 'moderate',
    region: 'Volta',
    location: 'Ho Municipality',
    lat: 6.6008,
    lng: 0.4713,
    reportedAt: '2026-07-12T06:05:00Z',
    status: 'active',
    confidence: 63,
    witnessReports: 3,
    gpsVerified: false,
    hasEvidence: true,
    verification: 'needs-verification',
  },
  {
    id: 'INC-2047',
    title: 'Suspected gas leak',
    category: 'other',
    severity: 'moderate',
    region: 'Western',
    location: 'Takoradi Harbour Area',
    lat: 4.8895,
    lng: -1.7554,
    reportedAt: '2026-07-12T05:30:00Z',
    status: 'active',
    confidence: 47,
    witnessReports: 1,
    gpsVerified: false,
    hasEvidence: false,
    verification: 'needs-verification',
  },
  {
    id: 'INC-2048',
    title: 'Coastal flooding warning',
    category: 'flood',
    severity: 'moderate',
    region: 'Central',
    location: 'Cape Coast Shoreline',
    lat: 5.1053,
    lng: -1.2466,
    reportedAt: '2026-07-12T04:50:00Z',
    status: 'active',
    confidence: 70,
    witnessReports: 5,
    gpsVerified: true,
    hasEvidence: true,
    verification: 'pending',
  },
]

export const GHANA_CENTER: [number, number] = [7.9465, -1.0232]
