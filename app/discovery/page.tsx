"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Clock, 
  Share2, 
  Bookmark, 
  BookmarkCheck, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  BookOpen, 
  ChevronRight, 
  Info,
  Calendar,
  X,
  Building,
  Bell,
  Compass,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { FloatingActions } from "@/components/floating-actions";
import { AGENCIES, CATEGORY_META, type IncidentCategory } from "@/lib/data";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const DISCOVERY_CATEGORIES = [
  "All",
  "Emergency News",
  "Fire",
  "Flood",
  "Medical",
  "Road Accident",
  "Weather",
  "Community Safety",
  "Police",
  "Utilities",
  "Public Advisory"
];

export default function DiscoveryPage() {
  const feed = useQuery(api.discovery.getDiscoveryFeed, {});
  const toggleBookmark = useMutation(api.discovery.toggleBookmark);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBookmarkToggle = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    try {
      const res = await toggleBookmark({ incidentId: id });
      showToast(res.bookmarked ? "Article saved to bookmarks." : "Article removed from bookmarks.");
    } catch (err) {
      showToast("Please register or sign in to save articles.");
    }
  };

  const handleShare = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/discovery?article=${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.summary,
          url: shareUrl
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Shareable link copied to clipboard!");
      } catch (err) {
        showToast("Failed to copy link.");
      }
    }
  };

  if (feed === undefined) {
    return (
      <ProtectedRoute fallbackUrl="/login">
        <Navbar />
        <div className="flex h-[80vh] w-full items-center justify-center bg-[#070b14]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-slate-400 font-mono">Syncing emergency advisory portal...</p>
          </div>
        </div>
        <FloatingActions />
      </ProtectedRoute>
    );
  }

  // Filter items
  const filteredItems = feed.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.agency || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      selectedCategory === "All" || 
      item.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const selectedArticle = feed.find((a) => a.id === selectedArticleId);

  return (
    <ProtectedRoute fallbackUrl="/login">
      <Navbar />
      <div className="min-h-screen bg-[#070b14] pt-24 pb-12 text-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Emergency Discovery Portal</h1>
              <p className="text-sm text-slate-400 mt-1">Official safety advisories, community warnings, and published dispatch alerts from Ghana services.</p>
            </div>
            
            <div className="relative w-full md:max-w-xs shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search advisories & regions..."
                className="w-full rounded-lg border border-slate-800 bg-[#0d1424] py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Category Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {DISCOVERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer",
                  selectedCategory === cat
                    ? "bg-primary border-primary text-white"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Layout of feed */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, idx) => {
              const isAlert = ["advisory", "road_closure", "weather"].includes(item.type);
              const agencyData = AGENCIES.find((a) => a.id === item.agency.toLowerCase()) || {
                short: item.agency,
                accent: "#eab308"
              };

              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  onClick={() => {
                    setSelectedArticleId(item.id);
                    setActiveMediaIndex(0);
                  }}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-5 shadow-md hover:shadow-lg cursor-pointer transition-all duration-200",
                    isAlert 
                      ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40" 
                      : "border-slate-850 bg-[#0d1424]/90 hover:border-slate-700 hover:bg-[#111a2e]"
                  )}
                >
                  <div className="space-y-3.5">
                    {/* Top Row Tag and Action */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: agencyData.accent }}
                        >
                          {agencyData.short}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 font-mono">
                          {new Date(item.publishedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleBookmarkToggle(e, item.id)}
                          className="rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                          aria-label="Bookmark"
                        >
                          {item.isBookmarked ? (
                            <BookmarkCheck className="size-4 text-primary" />
                          ) : (
                            <Bookmark className="size-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleShare(e, item)}
                          className="rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                          aria-label="Share"
                        >
                          <Share2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Article Title */}
                    <h2 className="text-base font-bold text-white leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>

                    {/* Summary text */}
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Footer Meta Row */}
                  <div className="mt-5 pt-3 border-t border-slate-800/45 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3 text-slate-500" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="size-3 text-slate-500" />
                      <span>{item.readingTime}</span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500">
                No safety advisories or emergency news matching the selected parameters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Detail view modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-200 flex items-center justify-center px-4 py-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticleId(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-2xl text-slate-200 z-10 scrollbar-thin scrollbar-thumb-slate-800"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedArticleId(null)}
                className="absolute right-4 top-4 rounded-full bg-slate-900 border border-slate-850 p-1.5 text-slate-400 hover:text-white"
                aria-label="Close panel"
              >
                <X className="size-4" />
              </button>

              {/* Title & Metadata */}
              <div className="space-y-2.5 pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20 uppercase tracking-wide">
                    {selectedArticle.category}
                  </span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Published: {new Date(selectedArticle.publishedAt).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono">
                    {selectedArticle.agency}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{selectedArticle.title}</h2>
              </div>

              {/* Generalized Location Alert box */}
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-slate-950/65 p-3 text-xs border border-slate-900">
                <MapPin className="size-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-350">General Event Location</p>
                  <p className="text-slate-400 mt-0.5">{selectedArticle.location} (Exact coordinate records protected internally)</p>
                </div>
              </div>

              {/* Media Gallery / Lightbox */}
              {selectedArticle.media && selectedArticle.media.length > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-950 flex items-center justify-center relative border border-slate-850">
                    <FileText className="size-16 text-primary opacity-40 animate-pulse" />
                    <span className="absolute bottom-3 left-3 text-[10px] bg-black/60 px-2 py-0.5 rounded font-mono text-slate-300">
                      Safe Media File: {selectedArticle.media[activeMediaIndex]}
                    </span>
                  </div>
                  {selectedArticle.media.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedArticle.media.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveMediaIndex(i)}
                          className={cn(
                            "h-12 w-20 shrink-0 rounded overflow-hidden border bg-slate-950 text-slate-600 flex items-center justify-center font-mono text-[9px] relative",
                            activeMediaIndex === i ? "border-primary" : "border-slate-800"
                          )}
                        >
                          M-{i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Article content */}
              <div className="mt-6 space-y-4">
                <div className="text-sm leading-relaxed text-slate-300 bg-slate-950/20 p-4 rounded-xl border border-slate-900/50">
                  {selectedArticle.summary}
                </div>

                {"actionRequired" in selectedArticle && selectedArticle.actionRequired && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="size-4" />
                      Required Action & Directive
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-300">{"actionRequired" in selectedArticle ? selectedArticle.actionRequired : undefined}</p>
                  </div>
                )}
              </div>

              {/* Expiry alerts for advisories */}
              {"expiryDate" in selectedArticle && selectedArticle.expiryDate && (
                <div className="mt-6 text-[10px] text-slate-500 font-mono text-right">
                  Expires: {new Date(selectedArticle.expiryDate).toLocaleString()}
                </div>
              )}

              {/* Bottom footer button bar */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={(e) => handleBookmarkToggle(e, selectedArticle.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {selectedArticle.isBookmarked ? (
                    <>
                      <BookmarkCheck className="size-3.5 text-primary" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="size-3.5" />
                      Save Bookmark
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleShare(e, selectedArticle)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Share2 className="size-3.5" />
                  Share Advisory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ambient Toast message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-6 z-255 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-2xl flex items-center gap-2"
          >
            <Info className="size-4 text-primary shrink-0" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingActions />
    </ProtectedRoute>
  );
}

