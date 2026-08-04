"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Crosshair, 
  Phone, 
  ShieldAlert, 
  Video, 
  Music, 
  FileText, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Plus, 
  Send,
  Loader2,
  SlidersHorizontal,
  X,
  Compass,
  Check,
  ShieldCheck,
  Zap,
  Briefcase,
  AlertOctagon,
  Calendar,
  Building,
  Flag,
  Archive,
  History,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_META, SEVERITY_META, AGENCIES, type IncidentCategory, type Severity } from "@/lib/data";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";


const ROLE_PRIORITIES: Record<string, string[]> = {
  police: ["Crime / Security", "Road Accident"],
  fire: ["Fire"],
  ambulance: ["Medical"],
  nadmo: ["Flood", "Storm / Weather"],
  ecg: ["Power Outage", "Other"],
};

export default function EmergencyOperationsCentre() {
  const user = useQuery(api.users.current, {});
  const incidents = useQuery(api.responder.getLiveQueue, {});
  const updateStatus = useMutation(api.responder.updateIncidentStatus);
  const assignUnit = useMutation(api.responder.assignUnit);
  const addNote = useMutation(api.responder.addIncidentNote);
  const publishIncident = useMutation(api.responder.publishIncident);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = apiKey && apiKey !== "your_google_maps_api_key_here" && apiKey.trim() !== "";


  // States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Publication Wizard States
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [pubTitle, setPubTitle] = useState("");
  const [pubSummary, setPubSummary] = useState("");
  const [pubLocation, setPubLocation] = useState("");
  const [pubMedia, setPubMedia] = useState<string[]>([]);
  const [pubVisibility, setPubVisibility] = useState<"PUBLIC" | "RESTRICTED">("PUBLIC");
  const [pubPreviewMode, setPubPreviewMode] = useState(false);
  const [pubLoading, setPubLoading] = useState(false);

  const preparePublication = (incident: any) => {
    let generalizedLocation = incident.location?.address || "";
    // Clean house numbers, st, rd
    generalizedLocation = generalizedLocation
      .replace(/^\d+\s+/, "") 
      .replace(/\b(street|st|road|rd|ave|avenue|lane|ln)\b\.?/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    setPubTitle(incident.publicTitle || `${incident.incidentType} Incident`);
    setPubSummary(incident.publicSummary || incident.description || "");
    setPubLocation(incident.publicLocation || generalizedLocation || "Reported Area");
    setPubMedia(incident.publicMedia || incident.media || []);
    setPubVisibility(incident.visibility === "RESTRICTED" ? "RESTRICTED" : "PUBLIC");
    setPubPreviewMode(false);
    setIsPublishModalOpen(true);
  };

  // Notes
  const [noteText, setNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "status" | "assign" | "reject";
    targetStatus?: string;
    targetAgency?: string;
    title: string;
    description: string;
    loading: boolean;
  }>({
    isOpen: false,
    type: "status",
    title: "",
    description: "",
    loading: false,
  });

  if (incidents === undefined || user === undefined) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-400">Syncing with EOC Live Feed...</p>
        </div>
      </div>
    );
  }

  // Filter & Search Logic
  const prioritizedCategories = user?.role ? (ROLE_PRIORITIES[user.role] || []) : [];

  let filtered = incidents.filter((i) => {
    // Search query matches
    const matchesSearch = 
      i._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.location.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.assignedAgency || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Filters
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || i.severity === severityFilter;
    const matchesAgency = agencyFilter === "all" || i.assignedAgency === agencyFilter;
    const matchesVisibility = visibilityFilter === "all" || i.visibility === visibilityFilter;

    return matchesSearch && matchesStatus && matchesSeverity && matchesAgency && matchesVisibility;
  });

  // Sort: Priority categories first, then newest first
  filtered = filtered.sort((a, b) => {
    const aPriority = prioritizedCategories.includes(a.incidentType) ? 1 : 0;
    const bPriority = prioritizedCategories.includes(b.incidentType) ? 1 : 0;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    return b.createdAt - a.createdAt;
  });

  const selectedIncident = incidents.find((i) => i._id === selectedId);

  // Dispatch Action Handler
  const triggerStatusChange = (status: string, note?: string) => {
    setConfirmDialog({
      isOpen: true,
      type: "status",
      targetStatus: status,
      title: `Confirm Incident State: ${status}`,
      description: `Are you sure you want to transition this incident to ${status}? This action will update logs and notify associated responders.`,
      loading: false,
    });
  };

  const triggerAssignAgency = (agencyId: string) => {
    const agencyName = AGENCIES.find((a) => a.id === agencyId)?.name || agencyId;
    setConfirmDialog({
      isOpen: true,
      type: "assign",
      targetAgency: agencyId,
      title: `Assign Agency Coordination`,
      description: `Route this incident to the ${agencyName}? This will synchronize coordinates to their dispatch grid.`,
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    if (!selectedIncident) return;
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    try {
      if (confirmDialog.type === "status" && confirmDialog.targetStatus) {
        await updateStatus({
          id: selectedIncident._id,
          status: confirmDialog.targetStatus,
          note: `Incident transitioned to ${confirmDialog.targetStatus} in EOC Console.`,
        });
      } else if (confirmDialog.type === "assign" && confirmDialog.targetAgency) {
        await assignUnit({
          id: selectedIncident._id,
          unitName: confirmDialog.targetAgency,
        });
      }
      setConfirmDialog({ isOpen: false, type: "status", title: "", description: "", loading: false });
    } catch (err) {
      console.error(err);
      alert("Action failed to submit. Please verify connection.");
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !noteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      await addNote({
        id: selectedIncident._id,
        note: noteText.trim(),
      });
      setNoteText("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit internal note.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handlePublishIncident = async () => {
    if (!selectedIncident) return;
    setPubLoading(true);
    try {
      await publishIncident({
        id: selectedIncident._id,
        publicTitle: pubTitle,
        publicSummary: pubSummary,
        publicLocation: pubLocation,
        publicMedia: pubMedia,
        visibility: pubVisibility,
      });
      setIsPublishModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to publish incident.");
    } finally {
      setPubLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4 overflow-hidden text-slate-200">
      
      {/* Panel 1: Filterable Incident Queue */}
      <div className={cn(
        "flex flex-col rounded-lg border border-slate-800 bg-[#0b0f19] shadow-md transition-all duration-300",
        selectedId ? "w-1/3 shrink-0" : "w-full"
      )}>
        <div className="border-b border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Mission Queue</h2>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium border border-slate-800 transition-colors hover:bg-slate-800",
                showFilters && "bg-slate-800 text-white border-slate-700"
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
            </button>
          </div>
          
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Case, Type, Location..."
              className="w-full rounded-md border border-slate-800 bg-slate-950 py-1.5 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-primary/50"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Status</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="EN_ROUTE">EN_ROUTE</option>
                  <option value="ON_SCENE">ON_SCENE</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Severity</label>
                <select 
                  value={severityFilter} 
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Agency</label>
                <select 
                  value={agencyFilter} 
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none"
                >
                  <option value="all">All Agencies</option>
                  {AGENCIES.map(a => <option key={a.id} value={a.id}>{a.short}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Visibility</label>
                <select 
                  value={visibilityFilter} 
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none"
                >
                  <option value="all">All Visibility</option>
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Incident Queue List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filtered.map((incident) => {
            const hasPriority = prioritizedCategories.includes(incident.incidentType);
            const isSelected = selectedId === incident._id;
            return (
              <button
                key={incident._id}
                onClick={() => setSelectedId(isSelected ? null : incident._id)}
                className={cn(
                  "relative w-full rounded-lg border p-3.5 text-left transition-all duration-200",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                    : "border-slate-800 bg-[#0d1321] hover:border-slate-700 hover:bg-[#11192b]"
                )}
              >
                {hasPriority && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 rounded-l bg-primary" title="Priority Case" />
                )}
                
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-slate-400 font-mono truncate">
                      {incident._id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-bold text-slate-200 truncate">{incident.incidentType}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="mt-1.5 text-xs text-slate-400 truncate leading-relaxed">{incident.location.address}</p>
                
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      incident.status === "RESOLVED" || incident.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      incident.status === "ARCHIVED" ? "bg-slate-500/15 text-slate-400 border border-slate-700/60" :
                      "bg-red-500/10 text-red-400 border border-red-500/20"
                    )}>
                      {incident.status}
                    </span>
                    <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {incident.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {incident.visibility === "PUBLIC" ? (
                      <span title="Public Visibility"><Eye className="size-3 text-emerald-500" /></span>
                    ) : (
                      <span title="Internal Private"><EyeOff className="size-3 text-slate-500" /></span>
                    )}
                    {incident.aiConfidence && (
                      <span className="text-[9px] font-mono text-slate-500" title="AI Confidence">
                        {incident.aiConfidence}% AI
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">No matching incidents in current EOC window.</div>
          )}
        </div>
      </div>

      {/* Panels 2 & 3: Detailed Operations Area */}
      {selectedIncident ? (
        <div className="flex flex-1 gap-4 overflow-hidden">
          
          {/* Panel 2: Incident Details & Dispatch Panel */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-800 bg-[#0b0f19] shadow-md">
            {/* Detail Panel Header */}
            <div className="border-b border-slate-800 bg-slate-900/35 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">CASE ID: {selectedIncident._id.toUpperCase()}</span>
                    {selectedIncident.visibility === "PUBLIC" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">
                        <Eye className="size-3" /> Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-700/60 uppercase">
                        <EyeOff className="size-3" /> Private
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedIncident.incidentType}</h2>
                </div>
                <button 
                  onClick={() => setSelectedId(null)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                  aria-label="Close details"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Detail Panel Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Incident Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Telemetry Description</h3>
                <p className="text-sm leading-relaxed text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-850">
                  {selectedIncident.description || "No supplemental details provided."}
                </p>
              </div>

              {/* Geographic Coordinates & Address */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Geographic Coordinates</h3>
                <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-[#0d1321] p-3 text-sm">
                  <MapPin className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200">{selectedIncident.location.address}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      LAT: {selectedIncident.location.lat.toFixed(6)} | LNG: {selectedIncident.location.lng.toFixed(6)}
                      {selectedIncident.location.isApproximate && " (Approximate IP Coordinate)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence Viewer */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Evidence & Media Vault</h3>
                {selectedIncident.media && selectedIncident.media.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIncident.media.map((item, idx) => (
                      <div key={idx} className="relative rounded-lg border border-slate-800 bg-slate-950 p-2 text-center text-xs">
                        <FileText className="size-8 mx-auto mb-2 text-primary/80" />
                        <span className="font-mono text-slate-400 block truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-5 text-center text-xs text-slate-500">
                    No image or video evidence attached.
                  </div>
                )}
                
                {selectedIncident.voiceNote && (
                  <div className="rounded-lg border border-slate-800 bg-[#0d1321] p-3.5 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded bg-primary/10 text-primary">
                      <Music className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200">Voice Note Attachment</p>
                      <p className="text-[10px] text-slate-500 truncate">{selectedIncident.voiceNote}</p>
                    </div>
                    <audio controls className="h-6 w-32 outline-none scale-90" />
                  </div>
                )}
              </div>

              {/* Responder Note History & Editor */}
              <div className="space-y-3 pt-3 border-t border-slate-850">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Internal Responder Log</h3>
                
                <form onSubmit={handleSubmitNote} className="flex gap-2">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log operational update/note..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary/50"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !noteText.trim()}
                    className="flex size-8 shrink-0 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50"
                  >
                    {isSubmittingNote ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  </button>
                </form>

                {selectedIncident.notesHistory && selectedIncident.notesHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedIncident.notesHistory.map((note, idx) => (
                      <div key={idx} className="rounded bg-slate-950/60 p-2.5 text-xs border border-slate-900">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-semibold">
                          <span>{note.author}</span>
                          <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-300">{note.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center">No internal notes logged on this case file.</p>
                )}
              </div>

              {/* Status History timeline */}
              <div className="space-y-3 pt-3 border-t border-slate-850">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Status History</h3>
                <div className="relative border-l border-slate-800 ml-2.5 pl-4 space-y-4 text-xs">
                  {selectedIncident.statusHistory?.map((hist, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-0.5 flex size-2.5 items-center justify-center rounded-full bg-slate-850 ring-4 ring-[#0b0f19]">
                        <div className="size-1 rounded-full bg-primary" />
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-200">{hist.status}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(hist.timestamp).toLocaleString()}</span>
                      </div>
                      {hist.note && <p className="text-slate-400 mt-0.5">{hist.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* EOC Dispatch Controls Panel */}
            <div className="border-t border-slate-800 bg-slate-900/30 p-4 space-y-3.5">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Agency Routing</h3>
                <div className="flex flex-wrap gap-1.5">
                  {AGENCIES.map((agency) => (
                    <button
                      key={agency.id}
                      onClick={() => triggerAssignAgency(agency.id)}
                      className={cn(
                        "rounded px-2.5 py-1 text-xs font-semibold border transition-colors",
                        selectedIncident.assignedAgency === agency.id
                          ? "bg-slate-800 text-white border-slate-600"
                          : "bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-300"
                      )}
                    >
                      {agency.short}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">EOC Lifecycle States</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    onClick={() => triggerStatusChange("ACCEPTED")}
                    disabled={selectedIncident.status === "ACCEPTED"}
                    className="rounded bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => triggerStatusChange("EN_ROUTE")}
                    disabled={selectedIncident.status === "EN_ROUTE"}
                    className="rounded bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                  >
                    En Route
                  </button>
                  <button
                    onClick={() => triggerStatusChange("ON_SCENE")}
                    disabled={selectedIncident.status === "ON_SCENE"}
                    className="rounded bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                  >
                    On Scene
                  </button>
                  <button
                    onClick={() => triggerStatusChange("RESOLVED")}
                    disabled={selectedIncident.status === "RESOLVED"}
                    className="rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 py-1.5 text-xs font-semibold hover:bg-emerald-950/80 disabled:opacity-50"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => preparePublication(selectedIncident)}
                    className="rounded bg-purple-950/40 text-purple-400 border border-purple-900/60 py-1.5 text-xs font-semibold hover:bg-purple-950/80 col-span-2"
                  >
                    {selectedIncident.status === "PUBLISHED" ? "Edit Public Alert" : "Publish Alert"}
                  </button>
                  <button
                    onClick={() => triggerStatusChange("ARCHIVED")}
                    disabled={selectedIncident.status === "ARCHIVED"}
                    className="rounded bg-slate-900 border border-slate-850 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 disabled:opacity-50 col-span-2"
                  >
                    Archive Incident
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: AI Operational Intelligence (Right Panel) */}
          <div className="w-80 shrink-0 flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-[#0b0f19] shadow-md">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">AI Operational Intel</h2>
                {selectedIncident.aiManualReview && (
                  <span className="ml-auto rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-400 border border-orange-500/20">
                    Manual Review
                  </span>
                )}
              </div>

              {/* AI Summary */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Automated Summary</p>
                <div className="rounded bg-slate-950/85 p-3 text-xs leading-relaxed text-slate-300 border border-slate-900/80">
                  {selectedIncident.aiSummary || `AI detected high relevance for ${selectedIncident.incidentType}. Recommend immediate response.`}
                </div>
              </div>

              {/* AI Indicators */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/50 p-2.5 rounded border border-slate-900">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Confidence</p>
                  <p className={`text-lg font-bold mt-0.5 ${
                    (selectedIncident.aiConfidence ?? 0) >= 70 ? 'text-emerald-400' :
                    (selectedIncident.aiConfidence ?? 0) >= 40 ? 'text-orange-400' : 'text-slate-400'
                  }`}>
                    {selectedIncident.aiConfidence !== undefined && selectedIncident.aiConfidence !== null
                      ? `${selectedIncident.aiConfidence}%`
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded border border-slate-900">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Severity</p>
                  <p className="text-lg font-bold text-red-400 mt-0.5 uppercase">{selectedIncident.severity}</p>
                </div>
              </div>

              {/* AI Detected Labels */}
              {selectedIncident.aiLabels && selectedIncident.aiLabels.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detected Scene Elements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIncident.aiLabels.map((label: string, i: number) => (
                      <span key={i} className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dispatch Suggestions</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded">
                    <span className="text-slate-300 font-medium">Primary Agency</span>
                    <span className="text-slate-400 font-semibold uppercase">{selectedIncident.assignedAgency || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded">
                    <span className="text-slate-300 font-medium">Status</span>
                    <span className="text-slate-400 font-semibold">{selectedIncident.status}</span>
                  </div>
                </div>
              </div>

              {/* Spam / Override flag */}
              {selectedIncident.aiSpamOrMeme && (
                <div className="rounded bg-red-950/30 border border-red-800/40 p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertOctagon className="size-4 shrink-0" />
                  <div>
                    <p className="font-bold">Spam / Meme Flagged</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Citizen submitted this with a manual override request.</p>
                  </div>
                </div>
              )}

              {/* Integrity check */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Integrity Check</p>
                <div className="flex items-center gap-2 rounded bg-slate-950/80 p-3 text-xs">
                  <ShieldCheck className={`size-4 ${selectedIncident.aiManualReview ? 'text-orange-400' : 'text-emerald-500'}`} />
                  <div>
                    <p className="font-semibold text-slate-200">Verification Result</p>
                    <p className="text-[10px] text-slate-500">
                      {selectedIncident.aiManualReview
                        ? (selectedIncident.aiManualReviewReason || "Awaiting manual review")
                        : (selectedIncident.verificationResult || "AI Verified — No Issues Detected")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Incident Replay */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="size-3" /> Incident Replay
                </p>
                <div className="space-y-0">
                  {(() => {
                    const LIFECYCLE = ["RECEIVED", "AI_REVIEW", "PENDING_REVIEW", "ACCEPTED", "ASSIGNED", "EN_ROUTE", "ON_SCENE", "RESOLVED", "PUBLISHED"];
                    const history = selectedIncident.statusHistory ?? [];
                    const historyStatuses = history.map((h: any) => h.status);
                    const currentIdx = LIFECYCLE.indexOf(selectedIncident.status);
                    
                    return LIFECYCLE.map((step, idx) => {
                      const histEntry = history.find((h: any) => h.status === step);
                      const isCompleted = historyStatuses.includes(step);
                      const isCurrent = selectedIncident.status === step;
                      const isPending = idx > currentIdx;

                      return (
                        <div key={step} className="flex items-start gap-2.5">
                          <div className="flex flex-col items-center">
                            <div className={`mt-1 size-2.5 rounded-full flex-shrink-0 ${
                              isCurrent ? 'bg-primary ring-4 ring-primary/20' :
                              isCompleted ? 'bg-emerald-500' :
                              'bg-slate-800 border border-slate-700'
                            }`} />
                            {idx < LIFECYCLE.length - 1 && (
                              <div className={`w-px flex-1 my-0.5 ${isCompleted ? 'bg-emerald-500/40' : 'bg-slate-800'}`} style={{ height: '16px' }} />
                            )}
                          </div>
                          <div className="pb-2 min-w-0">
                            <p className={`text-[10px] font-bold ${
                              isCurrent ? 'text-primary' :
                              isCompleted ? 'text-slate-300' :
                              'text-slate-600'
                            }`}>{step}</p>
                            {histEntry && (
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {new Date(histEntry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Actions Guide */}
              <div className="rounded bg-slate-900/30 border border-slate-800/80 p-3 text-[11px] text-slate-400 leading-relaxed">
                When resolved, click <strong className="text-slate-300">Publish Alert</strong> to sync with citizen map indexes (requires citizen consent).
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#0b0f19] p-8 text-center shadow-md">
          <Compass className="size-12 text-slate-600 opacity-20 mb-3" />
          <h3 className="text-sm font-semibold text-slate-400">Select an Incident Case</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">Click on any live emergency alert in the queue to coordinate response logs and dispatch commands.</p>
        </div>
      )}

      {/* Confirmation Dialog component */}
      <Dialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(isOpen) => !confirmDialog.loading && setConfirmDialog(prev => ({ ...prev, isOpen }))}
      >
        <DialogContent className="bg-[#0b0f19] border border-slate-800 text-slate-250">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-500" />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1.5">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button
              disabled={confirmDialog.loading}
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="rounded bg-slate-900 border border-slate-850 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-850 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={confirmDialog.loading}
              onClick={handleConfirmAction}
              className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {confirmDialog.loading && <Loader2 className="size-3 animate-spin" />}
              Confirm Dispatch
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publication Dialog Component */}
      <Dialog 
        open={isPublishModalOpen} 
        onOpenChange={(isOpen) => !pubLoading && setIsPublishModalOpen(isOpen)}
      >
        {selectedIncident && (
        <DialogContent className="bg-[#0b0f19] border border-slate-800 text-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Compass className="size-5 text-primary" />
              Prepare Public Discovery Article
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              Sanitize, generalize, and preview this incident report before publishing to the citizen portal.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher */}
          <div className="flex border-b border-slate-800 mt-4 text-xs font-semibold">
            <button
              onClick={() => setPubPreviewMode(false)}
              className={cn(
                "px-4 py-2 border-b-2 transition-all cursor-pointer",
                !pubPreviewMode ? "border-primary text-white font-bold" : "border-transparent text-slate-400"
              )}
            >
              1. Edit Public Details
            </button>
            <button
              onClick={() => setPubPreviewMode(true)}
              className={cn(
                "px-4 py-2 border-b-2 transition-all cursor-pointer",
                pubPreviewMode ? "border-primary text-white font-bold" : "border-transparent text-slate-400"
              )}
            >
              2. Citizen Live Preview
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {!pubPreviewMode ? (
              /* EDIT DETAILS FORM */
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Public Title</label>
                  <input
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-primary"
                    placeholder="E.g. Structural Fire outbreak at Kaneshie"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Generalized Location</label>
                  <input
                    value={pubLocation}
                    onChange={(e) => setPubLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-primary"
                    placeholder="E.g. East Legon (Do not expose exact street/house numbers)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Public Summary (PII Cleaned)</label>
                  <textarea
                    value={pubSummary}
                    onChange={(e) => setPubSummary(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-primary resize-none"
                    placeholder="Detailed summary for the public feed..."
                  />
                </div>

                {/* Media checkboxes */}
                {selectedIncident.media && selectedIncident.media.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">Select Public Media Release</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIncident.media.map((file: string) => {
                        const isSelected = pubMedia.includes(file);
                        return (
                          <label 
                            key={file} 
                            className={cn(
                              "flex items-center gap-2 p-2 rounded border cursor-pointer select-none",
                              isSelected ? "bg-primary/5 border-primary/40 text-white" : "bg-slate-950 border-slate-850 text-slate-400"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setPubMedia(prev => 
                                  isSelected ? prev.filter(f => f !== file) : [...prev, file]
                                );
                              }}
                              className="accent-primary"
                            />
                            <span className="truncate font-mono text-[10px]">{file}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Publication Visibility</label>
                  <select
                    value={pubVisibility}
                    onChange={(e: any) => setPubVisibility(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                  >
                    <option value="PUBLIC">PUBLIC (Visible on Public Map & Feed)</option>
                    <option value="RESTRICTED">RESTRICTED (Visible internally / specific agencies only)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setPubPreviewMode(true)}
                  className="w-full rounded bg-primary py-2 text-xs font-semibold text-white hover:bg-primary/95 mt-4 cursor-pointer"
                >
                  Preview Before Publish
                </button>
              </div>
            ) : (
              /* LIVE CITIZEN PREVIEW CARD */
              <div className="space-y-4">
                <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-slate-400 flex items-center gap-2">
                  <Info className="size-4 text-amber-500 shrink-0" />
                  <span>Reporter identity, phone, email, exact GPS, private media, responder notes, and AI analysis are strictly hidden.</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20 uppercase tracking-wide">
                      {selectedIncident.incidentType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{pubTitle || "No title provided"}</h3>
                  
                  <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded text-[11px] border border-slate-850">
                    <MapPin className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-350">{pubLocation || "No Location Specified"}</p>
                      <p className="text-slate-500 text-[10px]">Generalized location (coordinates rounded to 3 decimal places).</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">{pubSummary || "No public summary provided."}</p>

                  {/* Public Map Marker Preview */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Public Map Marker</p>
                    <div className="h-44 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative flex items-center justify-center">
                      {isKeyConfigured ? (
                        <APIProvider apiKey={apiKey}>
                          <Map
                            defaultCenter={{ 
                              lat: Math.round(selectedIncident.location.lat * 1000) / 1000, 
                              lng: Math.round(selectedIncident.location.lng * 1000) / 1000 
                            }}
                            defaultZoom={13}
                            gestureHandling={'cooperative'}
                            disableDefaultUI={true}
                          >
                            <AdvancedMarker 
                              position={{ 
                                lat: Math.round(selectedIncident.location.lat * 1000) / 1000, 
                                lng: Math.round(selectedIncident.location.lng * 1000) / 1000 
                              }}
                            />
                          </Map>
                        </APIProvider>
                      ) : (
                        <div className="text-center p-3 text-[10px] text-slate-500">
                          Google Maps API key missing. Public marker preview is unavailable.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Public Media Gallery */}
                  {pubMedia.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Public media gallery ({pubMedia.length})</p>
                      <div className="grid grid-cols-3 gap-2">
                        {pubMedia.map((file, i) => (
                          <div key={i} className="aspect-square bg-slate-950 border border-slate-800 rounded flex flex-col items-center justify-center p-2 text-center text-[9px] text-slate-400 font-mono truncate">
                            <Video className="size-4 mb-1 text-slate-550" />
                            {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/40 text-[10px] text-slate-500 font-semibold uppercase font-mono">
                    <span>Authorized by: {selectedIncident.assignedAgency || "NEOC"}</span>
                    <span>1 min read</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 border-t border-slate-850 pt-4 flex flex-col sm:flex-row gap-2 justify-between w-full">
            <div className="flex gap-2">
              <button
                disabled={pubLoading}
                onClick={() => setPubPreviewMode(!pubPreviewMode)}
                className="rounded bg-slate-900 border border-slate-850 px-3.5 py-2 text-xs font-semibold text-slate-450 hover:bg-slate-850 disabled:opacity-50 cursor-pointer"
              >
                {pubPreviewMode ? "Edit Details" : "Preview Mode"}
              </button>
              <button
                disabled={pubLoading}
                onClick={async () => {
                  setPubLoading(true);
                  try {
                    await updateStatus({ id: selectedIncident._id, status: "ARCHIVED", note: "Case archived from publication dashboard." });
                    setIsPublishModalOpen(false);
                  } catch (err) {
                    alert("Failed to archive case.");
                  } finally {
                    setPubLoading(false);
                  }
                }}
                className="rounded bg-slate-950 border border-red-950 text-red-500/90 px-3.5 py-2 text-xs font-semibold hover:bg-red-950/20 cursor-pointer"
              >
                Archive Incident
              </button>
            </div>
            <div className="flex gap-2">
              <button
                disabled={pubLoading}
                onClick={() => setIsPublishModalOpen(false)}
                className="rounded bg-slate-900 border border-slate-850 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-850 disabled:opacity-50 cursor-pointer"
              >
                Return
              </button>
              <button
                disabled={pubLoading || !pubTitle.trim() || !pubSummary.trim() || !pubLocation.trim()}
                onClick={handlePublishIncident}
                className="rounded bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {pubLoading && <Loader2 className="size-3 animate-spin" />}
                Publish Alert
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
        )}
      </Dialog>

    </div>
  );
}
